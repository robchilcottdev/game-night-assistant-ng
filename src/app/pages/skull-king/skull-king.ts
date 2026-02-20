import { Component, signal, computed, ElementRef, ViewChild, OnInit, AfterViewInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ISkullKingPlayer, ISkullKingRound } from '../../interfaces/player';
import { ILogItem } from '../../interfaces/logItem';
import { FormsModule } from '@angular/forms';
import { Dock } from "../../components/dock/dock";
import { SettingsService } from '../../services/settings-service';
import { TriggerService } from '../../services/trigger-service';
import { HaApiService } from '../../services/api-service';
import { TriggerSettings } from "../../components/trigger-settings/trigger-settings";
import { ISettingsSkullKing, SettingsType } from '../../interfaces/settings';
import { GameStateSkullKing } from '../../interfaces/game-state';

@Component({
  selector: 'app-skull-king',
  imports: [FormsModule, DatePipe, Dock, TriggerSettings],
  templateUrl: './skull-king.html',
  styleUrl: './skull-king.css',
})

export class SkullKing implements OnInit, AfterViewInit {
  // services
  protected readonly settingsService = inject(SettingsService);
  protected readonly triggerService = inject(TriggerService);
  protected readonly apiService = inject(HaApiService);

  // html elements
  @ViewChild('dialogInfo') dialogInfo!: ElementRef;
  @ViewChild('dialogAddPlayer') dialogAddPlayer!: ElementRef;
  @ViewChild('inputAddName') inputAddName!: ElementRef;
  @ViewChild('dialogSettings') dialogSettings!: ElementRef;
  @ViewChild('dialogScriptSettings') dialogScriptSettings!: ElementRef;
  @ViewChild('dialogLeaderboard') dialogLeaderboard!: ElementRef;
  @ViewChild('dialogLog') dialogLog!: ElementRef;
  @ViewChild('dialogBid') dialogBid!: ElementRef;
  @ViewChild('dialogScoreRound') dialogScoreRound!: ElementRef;

  // variables
  protected log: ILogItem[] = [];
  protected players = signal<ISkullKingPlayer[]>([]);
  protected newPlayerId = 0;
  protected currentRound = signal(1);
  protected settingsType: SettingsType = SettingsType.SkullKing;
  protected settings = signal(this.settingsService.defaultSettings(this.settingsType) as ISettingsSkullKing);
  protected selectedPlayerId = signal(0);

  protected selectedPlayer = computed(() => {
    return this.players().find(p => p.Id === this.selectedPlayerId());
  });

  protected showBidButton = computed(() => {
    if (this.players().length > 0 && this.players()[0].rounds != null) {
      if (this.players()[0].rounds[this.currentRound()-1].bidSet === false) {
        return true;
      }
    }
    return false;
  });

  protected showScoreRoundButton = computed(() => {
    if (this.players().length > 0 && this.players()[0].rounds != null) {
      if (this.players()[0].rounds[this.currentRound()-1].complete === true) {
        return true;
      }
    }
    return false;
  });

  protected bidLabels = computed(() => {
    return Array<number>(this.currentRound() + 1);
  })

  // lifecycle hooks
  ngOnInit(): void {
    this.settings.set(this.settingsService.getGameSettings(this.settingsType) as ISettingsSkullKing);
    this.loadGameState();
  }

  ngAfterViewInit(): void {
    this.dialogSettings.nativeElement.showModal();
  }

  addPlayer() {
    this.dialogAddPlayer.nativeElement.showModal();
  }

  showLeaderboard() {
    this.dialogLeaderboard.nativeElement.showModal();
  }

  showMakeBid(){
    this.dialogBid.nativeElement.showModal();
  }

  showScoreRound(){
    this.dialogScoreRound.nativeElement.showModal();
  }

  // Helpers
  confirmAddPlayer() {
    const name = this.inputAddName.nativeElement.value;
    if (name.length === 0) return;

    let newPlayer = { 
        Id: this.newPlayerId + 1,
        Name: name,
        Score: 0,
        Active: true,
        IsStartingPlayer: false,
        rounds: [] as ISkullKingRound[]
    } as ISkullKingPlayer;

    for (let i = 0; i < 10; i++) {
      newPlayer.rounds.push({ 
        bid: 0,
        bidSet: false,
        made: 0,
        bidPoints: 0,
        bonusPoints: 0,
        started: false,
        complete: false
      } as ISkullKingRound);
    }

    newPlayer.rounds[0].started = true;

    this.players.update(values => {
      return [...values, newPlayer]
    });
    this.log.push({ DateStamp: new Date(), Text: `Added player ${name}` });
    this.newPlayerId++;
    this.dialogAddPlayer.nativeElement.close();
    this.inputAddName.nativeElement.value = "";

    this.saveGameState();
  }

  setBid(playerId: number, bidAmount: number) {
    this.selectedPlayerId.set(playerId);

    this.selectedPlayer()!.rounds[this.currentRound()].bidSet = true;
    this.selectedPlayer()!.rounds[this.currentRound()].bid = bidAmount;
  }

  clearLog() {
    this.log = [];
    this.saveGameState();
  }

  resetScores() {
    let players = [...this.players()];
    for (const player of players) {
      player.Score = this.settings().startingScore ?? 0;
    }
    this.players.set(players);
    
    this.log.push({ DateStamp: new Date(), Text: 'Scores were reset' });
    this.saveGameState();
  }

  getPlayersByScoreDescending() {
    let players = [...this.players()];
    return players.sort((a, b) => (b.Score > a.Score ? 1 : -1));
  }

  resetSettings() {
    this.settings.set(this.settingsService.defaultSettings(this.settingsType) as ISettingsSkullKing);
  }

  saveSettings() {
    this.dialogSettings.nativeElement.close();
    this.settingsService.saveGameSettings(this.settingsType, this.settings());
  }

  loadGameState() {
    let loadedGameState = this.settingsService.loadGameState(SettingsType.SkullKing) as GameStateSkullKing;
    if (loadedGameState){
      this.log = loadedGameState.log;
      this.players.set(loadedGameState.players);
    }
  }

  saveGameState() {
    let gameState : GameStateSkullKing = {
      currentPlayerIndex: 0,
      log: this.log,
      players: this.players(),
      selectedPlayerId: 0
    };

    //this.settingsService.saveGameState(SettingsType.SkullKing, gameState);
  }

  // Dock buttons
  doReload() {
    this.players.set([]);
    this.log.push({ DateStamp: new Date(), Text: 'Scoreboard reloaded.' });
  }

  showInfo() {
    this.dialogInfo.nativeElement.showModal();
  }

  showLog() {
    this.dialogLog.nativeElement.showModal();
  }

  showSettings() {
    this.dialogSettings.nativeElement.showModal();
  }

  showScriptSettings() {
    this.dialogScriptSettings.nativeElement.showModal();
  }

  closeScriptSettingsDialog(){
    this.dialogScriptSettings.nativeElement.close();
  }

}
