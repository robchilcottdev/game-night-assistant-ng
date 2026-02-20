import { AfterViewInit, Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Dock } from "../../components/dock/dock";
import { SettingsService } from '../../services/settings-service';
import { TriggerService } from '../../services/trigger-service';
import { IFarklePlayer } from '../../interfaces/player';
import { ILogItem } from '../../interfaces/logItem';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ISettingsFarkle, SettingsType } from '../../interfaces/settings';
import { AvailableTriggersFarkle } from '../../interfaces/enums';
import { TriggerSettings } from "../../components/trigger-settings/trigger-settings";
import { GameStateFarkle } from '../../interfaces/game-state';

@Component({
  selector: 'app-farkle',
  imports: [Dock, DatePipe, FormsModule, TriggerSettings],
  templateUrl: './farkle.html',
  styleUrl: './farkle.css',
})

export class Farkle implements OnInit, AfterViewInit {
  // services
  protected readonly settingsService = inject(SettingsService);
  protected readonly triggerService = inject(TriggerService);

  // html elements
  @ViewChild('dialogInfo') dialogInfo!: ElementRef;
  @ViewChild('dialogLog') dialogLog!: ElementRef;
  @ViewChild('dialogSettings') dialogSettings!: ElementRef;
  @ViewChild('dialogScriptSettings') dialogScriptSettings!: ElementRef;
  @ViewChild('dialogAddPlayer') dialogAddPlayer!: ElementRef;
  @ViewChild('inputAddName') inputAddName!: ElementRef;
  @ViewChild('dialogEditName') dialogEditName!: ElementRef;
  @ViewChild('inputEditName') inputEditName!: ElementRef;
  @ViewChild('dialogEditScore') dialogEditScore!: ElementRef;
  @ViewChild('inputModifyScoreAmount') inputModifyScoreAmount!: ElementRef;
  @ViewChild('inputEditedScore') inputEditedScore!: ElementRef;

  // variables
  protected log: ILogItem[] = [];
  protected players = signal<IFarklePlayer[]>([]);
  protected newPlayerId = 0;
  protected currentPlayerIndex = signal(0);
  protected selectedPlayerId = signal(0);
  protected currentEditedPlayerScore = signal(0);
  protected settingsType: SettingsType = SettingsType.Farkle;
  protected settings = signal(this.settingsService.defaultSettings(this.settingsType) as ISettingsFarkle);

  // computed
  protected selectedPlayer = computed(() => {
    if (!this.selectedPlayerId) return undefined;
    return this.players().find(p => p.Id === this.selectedPlayerId()) ?? undefined;
  });

  protected startingScoreIsNotMet = computed(() => {
    return this.settings().minimumPointsToStart > 0 &&
      !this.selectedPlayer()?.HasStarted === false &&
      this.selectedPlayer()?.Score === 0 &&
      this.currentEditedPlayerScore() < this.settings().minimumPointsToStart;
  });

  // lifecycle hooks
  ngOnInit(): void {
    this.settings.set(this.settingsService.getGameSettings(this.settingsType) as ISettingsFarkle);
    this.loadGameState();
  }

  ngAfterViewInit(): void {
    this.dialogSettings.nativeElement.showModal();
  }

  // Open dialogs
  addPlayer() {
    this.dialogAddPlayer.nativeElement.showModal();
  }

  // helpers
  confirmAddPlayer() {
    const name = this.inputAddName.nativeElement.value;
    if (name.length === 0) return;

    this.players.update(values => {
      return [...values, { Id: this.newPlayerId + 1, Name: name, Score: 0, Active: true, IsStartingPlayer: false, Farkles: 0, HasStarted: true }];
    });
    this.log.push({ DateStamp: new Date(), Text: `Added player ${name}` });
    this.newPlayerId++;
    this.dialogAddPlayer.nativeElement.close();
    this.inputAddName.nativeElement.value = "";

    this.saveGameState();
    this.triggerService.runTrigger(AvailableTriggersFarkle.PlayerAdded);    
  }

  editName(playerId: number) {
    this.selectedPlayerId.set(playerId);
    this.dialogEditName.nativeElement.showModal();
  }

  confirmEditName() {
    if (this.inputEditName.nativeElement.value === "") return;
    this.log.push({ DateStamp: new Date(), Text: `${this.selectedPlayer()!.Name} changed name to ${this.inputEditName.nativeElement.value}` });
    this.selectedPlayer()!.Name = this.inputEditName.nativeElement.value;
    this.dialogEditName.nativeElement.close();
    this.inputEditName.nativeElement.value = "";
    this.saveGameState();
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

    this.saveGameState();

    this.triggerService.runTrigger(AvailableTriggersFarkle.FirstPlayerSelected);
  }

  randomiseTurn() {
    this.log.push({ DateStamp: new Date(), Text: `Randomising starting player...` });
    this.currentPlayerIndex.set(Math.floor(Math.random() * this.players().length));
    this.setStartingPlayer(this.players()[this.currentPlayerIndex()].Id);
    this.saveGameState();
  }

  scoreFourOfAKind(){
    this.addScore(1000);
    this.triggerService.runTrigger(AvailableTriggersFarkle.FourOfAKindScored);
  }

  scoreFiveOfAKind(){
    this.addScore(2000);
    this.triggerService.runTrigger(AvailableTriggersFarkle.FiveOfAKindScored);
  }

  scoreSixOfAKind(){
    this.addScore(3000);
    this.triggerService.runTrigger(AvailableTriggersFarkle.SixOfAKindScored);
  }

  scoreStraight(){
    this.addScore(1500);
    this.triggerService.runTrigger(AvailableTriggersFarkle.StraightScored);
  }

  scoreThreePairs(){
    this.addScore(1500);
    this.triggerService.runTrigger(AvailableTriggersFarkle.ThreePairsScores);
  }

  scoreTwoTriplets(){
    this.addScore(2500);
    this.triggerService.runTrigger(AvailableTriggersFarkle.TwoTripletsScored);
  }

  addScore(amount: number) {
    this.currentEditedPlayerScore.update(v => v + amount);
    this.saveGameState();
  }

  editScore(playerId: number) {
    this.selectedPlayerId.set(playerId);
    this.dialogEditScore.nativeElement.showModal();
  }

  confirmEditScore(hotDice: boolean) {
    this.dialogEditScore.nativeElement.close();

    const previousScore = this.selectedPlayer()!.Score;
    let thisScore = parseInt(this.inputEditedScore.nativeElement.value);

    // reset farkles
    if (thisScore > 0) {
      if (this.selectedPlayer()!.Farkles > 0){
        this.triggerService.runTrigger(AvailableTriggersFarkle.FarkleCleared);
      }

      this.selectedPlayer()!.Farkles = 0;
      // mark as started, if not already
      if (this.selectedPlayer()!.HasStarted) this.selectedPlayer()!.HasStarted = true;
    }

    if (!this.settings().allowNegativeScores && thisScore < 0) thisScore = 0;

    this.selectedPlayer()!.Score += thisScore;
    this.log.push({ DateStamp: new Date(), Text: `${this.selectedPlayer()!.Name} scored ${thisScore}` });

    if (!hotDice) {
      this.currentEditedPlayerScore.set(0);
    }

    if (thisScore > previousScore) this.triggerService.runTrigger(AvailableTriggersFarkle.ScoreIncrease);
    if (thisScore < previousScore) this.triggerService.runTrigger(AvailableTriggersFarkle.ScoreDecrease);
    if (thisScore >= this.settings().targetScore!) this.triggerService.runTrigger(AvailableTriggersFarkle.TargetScoreReached);

    this.saveGameState();

    if (this.settings().autoAdvanceOnScoreUpdate) {
      return this.advanceTurn();
    }

  }
  
  farkle() {
    // you can't farkle someone on zero points    
    if (this.selectedPlayer()!.Score > 0) {
      this.currentEditedPlayerScore.set(0);
      this.selectedPlayer()!.Farkles++;

      if (this.selectedPlayer()!.Farkles === 1) this.triggerService.runTrigger(AvailableTriggersFarkle.Farkle);
      if (this.selectedPlayer()!.Farkles === 2) this.triggerService.runTrigger(AvailableTriggersFarkle.TwoFarkles);
      if (this.selectedPlayer()!.Farkles === 3) this.triggerService.runTrigger(AvailableTriggersFarkle.ThreeFarkles);

      // oh dear... you've farkled out
      if (this.selectedPlayer()!.Farkles === 3) {
        this.selectedPlayer()!.Farkles = 0; // reset to a clean start
        this.selectedPlayer()!.Score -= this.settings().threeFarklePenalty;
        if (this.selectedPlayer()!.Score < 0 && !this.settings().allowNegativeScores) this.selectedPlayer()!.Score = 0;
        this.log.push({ DateStamp: new Date(), Text: `${this.selectedPlayer()!.Name} farkled out for a penalty of ${this.settings().threeFarklePenalty} points!` });
      }
    }

    this.dialogEditScore.nativeElement.close();

    this.saveGameState();

    if (this.settings().autoAdvanceOnScoreUpdate) {
      this.advanceTurn();
    }
  }

  advanceTurn() {
    if (this.currentPlayerIndex() === this.players().length - 1) {
      this.currentPlayerIndex.set(0);
    } else {
      this.currentPlayerIndex.update(value => value + 1);
    }
    this.log.push({ DateStamp: new Date(), Text: `It's your turn, ${this.players()[this.currentPlayerIndex()].Name}` });

    if (this.settings().autoOpenEditScoreOnAdvance) {
      this.selectedPlayerId.set(this.players()[this.currentPlayerIndex()].Id);
      this.editScore(this.selectedPlayerId());
    }
    this.saveGameState();
  }

  clearLog() {
    this.log = [];
    this.saveGameState();
  }

  resetScores() {
    let players = [...this.players()];
    for (const player of players) {
      player.Score = 0;
      player.Farkles = 0;
      player.HasStarted = false;
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
    this.settings.set(this.settingsService.defaultSettings(this.settingsType) as ISettingsFarkle);
  }

  saveSettings() {
    this.dialogSettings.nativeElement.close();
    this.settingsService.saveGameSettings(this.settingsType, this.settings());
  }

  closeScriptSettingsDialog(){
    this.dialogScriptSettings.nativeElement.close();
  }

  loadGameState() {
      let loadedGameState = this.settingsService.loadGameState(SettingsType.Farkle) as GameStateFarkle;
      if (loadedGameState){
        this.currentEditedPlayerScore.set(loadedGameState.currentEditedPlayerScore!);
        this.currentPlayerIndex.set(loadedGameState.currentPlayerIndex);
        this.log = loadedGameState.log;
        this.players.set(loadedGameState.players);
        this.selectedPlayerId.set(loadedGameState.selectedPlayerId);        
      }
    }
  
    saveGameState() {
      let gameState : GameStateFarkle = {
        currentEditedPlayerScore: this.currentEditedPlayerScore(),
        currentPlayerIndex: this.currentPlayerIndex(),
        log: this.log,
        players: this.players(),
        selectedPlayerId: this.selectedPlayerId()        
      };
  
      this.settingsService.saveGameState(SettingsType.Farkle, gameState);
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
}
