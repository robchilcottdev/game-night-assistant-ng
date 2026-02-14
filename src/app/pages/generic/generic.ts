import { Component, signal, computed, ElementRef, ViewChild, OnInit, AfterViewInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IPlayer } from '../../interfaces/player';
import { ILogItem } from '../../interfaces/logItem';
import { PlayDirection, AvailableTriggersGeneric } from '../../interfaces/enums';
import { FormsModule } from '@angular/forms';
import { Dock } from "../../components/dock/dock";
import { SettingsService } from '../../services/settings-service';
import { TriggerService } from '../../services/trigger-service';
import { HaApiService } from '../../services/api-service';
import { TriggerSettings } from "../../components/trigger-settings/trigger-settings";
import { ISettingsGeneric, SettingsType } from '../../interfaces/settings';

@Component({
  selector: 'app-generic',
  imports: [FormsModule, DatePipe, Dock, TriggerSettings],
  templateUrl: './generic.html',
  styleUrl: './generic.css',
})

export class Generic implements OnInit, AfterViewInit {
  // services
  protected readonly settingsService = inject(SettingsService);
  protected readonly triggerService = inject(TriggerService);
  protected readonly apiService = inject(HaApiService);

  // html elements
  @ViewChild('dialogEditName') dialogEditName!: ElementRef;
  @ViewChild('dialogInfo') dialogInfo!: ElementRef;
  @ViewChild('dialogAddPlayer') dialogAddPlayer!: ElementRef;
  @ViewChild('inputAddName') inputAddName!: ElementRef;
  @ViewChild('inputEditName') inputEditName!: ElementRef;
  @ViewChild('dialogEditScore') dialogEditScore!: ElementRef;
  @ViewChild('inputEditedScore') inputEditedScore!: ElementRef;
  @ViewChild('inputModifyScoreAmount') inputModifyScoreAmount!: ElementRef;
  @ViewChild('dialogSettings') dialogSettings!: ElementRef;
  @ViewChild('dialogScriptSettings') dialogScriptSettings!: ElementRef;
  @ViewChild('dialogLeaderboard') dialogLeaderboard!: ElementRef;
  @ViewChild('dialogLog') dialogLog!: ElementRef;

  // variables
  protected log: ILogItem[] = [];
  protected players = signal<IPlayer[]>([]);
  protected newPlayerId = 0;
  protected currentPlayerIndex = signal(0);
  protected selectedPlayerId = signal(0);
  protected playDirection = signal<PlayDirection>(PlayDirection.Clockwise);
  protected modifyScoreAmount = signal(1);
  protected currentEditedPlayerScore = signal(0);
  protected settingsType: SettingsType = SettingsType.Generic;
  protected settings = signal(this.settingsService.defaultSettings(this.settingsType) as ISettingsGeneric);

  // computed
  protected playDirectionText = computed(() => {
    return this.playDirection() === PlayDirection.Clockwise ? "clockwise" : "anticlockwise";
  });

  protected selectedPlayer = computed(() => {
    return this.players().find(p => p.Id === this.selectedPlayerId());
  });

  // lifecycle hooks
  ngOnInit(): void {
    this.settings.set(this.settingsService.getGameSettings(this.settingsType) as ISettingsGeneric);
  }

  ngAfterViewInit(): void {
    this.dialogSettings.nativeElement.showModal();
  }

  // Open dialogs
  editName(playerId: number) {
    this.selectedPlayerId.set(playerId);
    this.dialogEditName.nativeElement.showModal();
  }

  addPlayer() {
    this.dialogAddPlayer.nativeElement.showModal();
  }

  editScore(playerId: number) {
    this.selectedPlayerId.set(playerId);
    this.currentEditedPlayerScore.set(this.selectedPlayer()?.Score ?? 0);
    this.dialogEditScore.nativeElement.showModal();
  }
    
  showLeaderboard() {
    this.dialogLeaderboard.nativeElement.showModal();
  }

  // Helpers
  confirmAddPlayer() {
    const name = this.inputAddName.nativeElement.value;
    if (name.length === 0) return;

    this.players.update(values => {
      return [...values, { Id: this.newPlayerId + 1, Name: name, Score: this.settings().startingScore ?? 0, Active: true, IsStartingPlayer: false }];
    });
    this.log.push({ DateStamp: new Date(), Text: `Added player ${name}` });
    this.newPlayerId++;
    this.dialogAddPlayer.nativeElement.close();
    this.inputAddName.nativeElement.value = "";

    this.triggerService.runTrigger(AvailableTriggersGeneric.PlayerAdded);
  }

  selectPlayer(playerId: number) {
    this.selectedPlayerId.set(playerId);
    this.currentPlayerIndex.set(this.players().findIndex(p => p.Id === playerId));
    this.log.push({ DateStamp: new Date(), Text: `It's your turn, ${this.players()[this.currentPlayerIndex()].Name}` });
  }

  confirmEditName() {
    if (this.inputEditName.nativeElement.value === "") return;
    this.log.push({ DateStamp: new Date(), Text: `${this.selectedPlayer()!.Name} changed name to ${this.inputEditName.nativeElement.value}` });
    this.selectedPlayer()!.Name = this.inputEditName.nativeElement.value;
    this.dialogEditName.nativeElement.close();
    this.inputEditName.nativeElement.value = "";
  }

  incrementScore() {
    const amount = parseInt(this.inputModifyScoreAmount.nativeElement.value);
    this.currentEditedPlayerScore.update(value => value + amount);
  }

  decrementScore() {
    let amount = parseInt(this.inputModifyScoreAmount.nativeElement.value);

    this.currentEditedPlayerScore.update(value => value - amount);

    // correct a negative score if rules prevent them
    if (!this.settings().allowNegativeScores) {
      if ((this.currentEditedPlayerScore() - amount) < 0) {
        this.currentEditedPlayerScore.set(0);
      }
    }
  }

  confirmEditScore() {
    this.dialogEditScore.nativeElement.close();

    const previousScore = this.selectedPlayer()!.Score;
    let thisScore = parseInt(this.inputEditedScore.nativeElement.value);

    if (!this.settings().allowNegativeScores && thisScore < 0) thisScore = 0;

    this.selectedPlayer()!.Score = thisScore;
    this.log.push({ DateStamp: new Date(), Text: `${this.selectedPlayer()!.Name} score changed to ${thisScore}` });

    this.modifyScoreAmount.set(0);

    if (thisScore === previousScore) this.triggerService.runTrigger(AvailableTriggersGeneric.ZeroScored);
    if (thisScore > previousScore) this.triggerService.runTrigger(AvailableTriggersGeneric.ScoreIncrease);
    if (thisScore < previousScore) this.triggerService.runTrigger(AvailableTriggersGeneric.ScoreDecrease);
   
    if (this.settings().autoAdvanceOnScoreUpdate) {
      return this.advanceTurn();
    }
  }

  deletePlayer(playerId: number) {
    let players = [...this.players()];
    let playerToDelete = players.find(p => p.Id === playerId);
    this.log.push({ DateStamp: new Date(), Text: playerToDelete?.Active ? `Goodbye, ${playerToDelete?.Name}!` : `${playerToDelete?.Name} is back!` });
    playerToDelete!.Active = !playerToDelete!.Active;
    this.players.set(players);
    
    this.triggerService.runTrigger(AvailableTriggersGeneric.PlayerRemoved);
  }

  setStartingPlayer(playerId: number) {
    let players = [...this.players()];
    players.forEach(p => p.IsStartingPlayer = false);
    let player = players.find(p => p.Id === playerId);
    player!.IsStartingPlayer = true;
    this.log.push({ DateStamp: new Date(), Text: `${player?.Name} was set as starting player` });
    this.players.set(players);
    this.currentPlayerIndex.set(this.players().findIndex(p => p.Id === playerId));
    this.dialogEditName.nativeElement.close();

    this.triggerService.runTrigger(AvailableTriggersGeneric.FirstPlayerSelected);
  }

  changeDirection() {
    if (this.playDirection() === PlayDirection.Clockwise) {
      this.log.push({ DateStamp: new Date(), Text: `Play direction changed to anti-clockwise` });
      this.playDirection.set(PlayDirection.Anticlockwise);
    } else {
      this.log.push({ DateStamp: new Date(), Text: `Play direction changed to clockwise` });
      this.playDirection.set(PlayDirection.Clockwise);
    }
  }

  randomiseTurn() {
    this.log.push({ DateStamp: new Date(), Text: `Randomising starting player...` });
    this.currentPlayerIndex.set(Math.floor(Math.random() * this.players().length));
    this.setStartingPlayer(this.players()[this.currentPlayerIndex()].Id);
  }

  advanceTurn() {
    do {
      if (this.playDirection() === PlayDirection.Clockwise) {
        if (this.currentPlayerIndex() === this.players().length - 1) {
          this.currentPlayerIndex.set(0);
        } else {
          this.currentPlayerIndex.update(value => value + 1);
        }
      } else { // anti-clockwise
        if (this.currentPlayerIndex() === 0) {
          this.currentPlayerIndex.set(this.players().length - 1);
        } else {
          this.currentPlayerIndex.update(value => value - 1);
        }
      }
    } while (!this.players()[this.currentPlayerIndex()].Active); // advance turn until we're not on a deleted/de-activated player
    this.log.push({ DateStamp: new Date(), Text: `It's your turn, ${this.players()[this.currentPlayerIndex()].Name}` });

    if (this.settings().autoOpenEditScoreOnAdvance) {
      this.selectedPlayerId.set(this.players()[this.currentPlayerIndex()].Id);
      this.currentEditedPlayerScore.set(this.players()[this.currentPlayerIndex()].Score);
      this.editScore(this.selectedPlayerId());
    }
  }

  clearLog() {
    this.log = [];
  }

  resetScores() {
    let players = [...this.players()];
    for (const player of players) {
      player.Score = this.settings().startingScore ?? 0;
    }
    this.players.set(players);
    this.log.push({ DateStamp: new Date(), Text: 'Scores were reset' });
  }

  getPlayersByScoreDescending() {
    let players = [...this.players()];
    return players.sort((a, b) => (b.Score > a.Score ? 1 : -1));
  }

  resetSettings() {
    this.settings.set(this.settingsService.defaultSettings(this.settingsType) as ISettingsGeneric);
  }

  saveSettings() {
    this.dialogSettings.nativeElement.close();
    this.settingsService.saveGameSettings(this.settingsType, this.settings());
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
