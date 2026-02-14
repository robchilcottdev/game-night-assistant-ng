import { AfterViewInit, Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Dock } from "../../components/dock/dock";
import { SettingsService } from '../../services/settings-service';
import { HaApiService } from '../../services/api-service';
import { IFarklePlayer } from '../../interfaces/player';
import { ILogItem } from '../../interfaces/logItem';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IScriptTrigger, ISettingsFarkle, SettingsType } from '../../interfaces/settings';
import { IAvailableScript } from '../../interfaces/api-result-entity-state';
import { AvailableTriggersFarkle } from '../../interfaces/enums';
import { DropdownListItem } from '../../interfaces/dropdown-list';

@Component({
  selector: 'app-farkle',
  imports: [Dock, DatePipe, FormsModule],
  templateUrl: './farkle.html',
  styleUrl: './farkle.css',
})

export class Farkle implements OnInit, AfterViewInit {
  // services
  protected readonly settingsService = inject(SettingsService);
  protected readonly apiService = inject(HaApiService);

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
  protected triggers = signal<IScriptTrigger[]>([]);
  protected newTrigger = signal("");
  protected newTriggerScript = signal("");
  protected availableTriggersDropdown = signal<DropdownListItem[]>([]);
  protected availableScripts: Array<IAvailableScript> = [];
  protected settings: ISettingsFarkle = this.settingsService.defaultSettings(SettingsType.Farkle) as ISettingsFarkle;
  protected duplicateTriggerWarning = signal(false);
  protected availableTriggersKeys = Object.keys(AvailableTriggersFarkle);
  protected availableTriggersValues = Object.values(AvailableTriggersFarkle);

  // computed
  protected selectedPlayer = computed(() => {
    if (!this.selectedPlayerId) return undefined;
    return this.players().find(p => p.Id === this.selectedPlayerId()) ?? undefined;
  });

  protected startingScoreIsNotMet = computed(() => {
    return this.settings.minimumPointsToStart > 0 &&
      !this.selectedPlayer()?.HasStarted === false &&
      this.selectedPlayer()?.Score === 0 &&
      this.currentEditedPlayerScore() < this.settings.minimumPointsToStart;
  });

  // lifecycle hooks
  ngOnInit(): void {
    this.settings = this.settingsService.getGameSettings(SettingsType.Farkle) as ISettingsFarkle;
    this.triggers.set(this.settingsService.getTriggers(SettingsType.Farkle));
    this.availableScripts = this.settingsService.getAvailableScripts();

    this.updateAvailableTriggers();
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

    this.runTrigger(AvailableTriggersFarkle.PlayerAdded);    
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

    this.runTrigger(AvailableTriggersFarkle.FirstPlayerSelected);
  }

  randomiseTurn() {
    this.log.push({ DateStamp: new Date(), Text: `Randomising starting player...` });
    this.currentPlayerIndex.set(Math.floor(Math.random() * this.players().length));
    this.setStartingPlayer(this.players()[this.currentPlayerIndex()].Id);
  }

  scoreFourOfAKind(){
    this.addScore(1000);
    this.runTrigger(AvailableTriggersFarkle.FourOfAKindScored);
  }

  scoreFiveOfAKind(){
    this.addScore(2000);
    this.runTrigger(AvailableTriggersFarkle.FiveOfAKindScored);
  }

  scoreSixOfAKind(){
    this.addScore(3000);
    this.runTrigger(AvailableTriggersFarkle.SixOfAKindScored);
  }

  scoreStraight(){
    this.addScore(1500);
    this.runTrigger(AvailableTriggersFarkle.StraightScored);
  }

  scoreThreePairs(){
    this.addScore(1500);
    this.runTrigger(AvailableTriggersFarkle.ThreePairsScores);
  }

  scoreTwoTriplets(){
    this.addScore(2500);
    this.runTrigger(AvailableTriggersFarkle.TwoTripletsScored);
  }

  addScore(amount: number) {
    this.currentEditedPlayerScore.update(v => v + amount);
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
        this.runTrigger(AvailableTriggersFarkle.FarkleCleared);
      }

      this.selectedPlayer()!.Farkles = 0;
      // mark as started, if not already
      if (this.selectedPlayer()!.HasStarted) this.selectedPlayer()!.HasStarted = true;
    }

    if (!this.settings.allowNegativeScores && thisScore < 0) thisScore = 0;

    this.selectedPlayer()!.Score += thisScore;
    this.log.push({ DateStamp: new Date(), Text: `${this.selectedPlayer()!.Name} scored ${thisScore}` });

    if (!hotDice) {
      this.currentEditedPlayerScore.set(0);
    }

    if (thisScore > previousScore) this.runTrigger(AvailableTriggersFarkle.ScoreIncrease);
    if (thisScore < previousScore) this.runTrigger(AvailableTriggersFarkle.ScoreDecrease);
    if (thisScore >= this.settings.targetScore) this.runTrigger(AvailableTriggersFarkle.TargetScoreReached);

    if (this.settings.autoAdvanceOnScoreUpdate) {
      return this.advanceTurn();
    }

  }
  
  farkle() {
    // you can't farkle someone on zero points    
    if (this.selectedPlayer()!.Score > 0) {
      this.currentEditedPlayerScore.set(0);
      this.selectedPlayer()!.Farkles++;

      if (this.selectedPlayer()!.Farkles === 1) this.runTrigger(AvailableTriggersFarkle.Farkle);
      if (this.selectedPlayer()!.Farkles === 2) this.runTrigger(AvailableTriggersFarkle.TwoFarkles);
      if (this.selectedPlayer()!.Farkles === 3) this.runTrigger(AvailableTriggersFarkle.ThreeFarkles);

      // oh dear... you've farkled out
      if (this.selectedPlayer()!.Farkles === 3) {
        this.selectedPlayer()!.Farkles = 0; // reset to a clean start
        this.selectedPlayer()!.Score -= this.settings.threeFarklePenalty;
        if (this.selectedPlayer()!.Score < 0 && !this.settings.allowNegativeScores) this.selectedPlayer()!.Score = 0;
        this.log.push({ DateStamp: new Date(), Text: `${this.selectedPlayer()!.Name} farkled out for a penalty of ${this.settings.threeFarklePenalty} points!` });
      }
    }

    this.dialogEditScore.nativeElement.close();

    if (this.settings.autoAdvanceOnScoreUpdate) {
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

    if (this.settings.autoOpenEditScoreOnAdvance) {
      this.selectedPlayerId.set(this.players()[this.currentPlayerIndex()].Id);
      this.editScore(this.selectedPlayerId());
    }
  }

  clearLog() {
    this.log = [];
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
  }

  getPlayersByScoreDescending() {
    let players = [...this.players()];
    return players.sort((a, b) => (b.Score > a.Score ? 1 : -1));
  }

  updateAvailableTriggers() {
    let availableTriggers : DropdownListItem[] = [];
    const currentTriggers = this.settingsService.getTriggers(SettingsType.Farkle);

    for (let i = 0; i < this.availableTriggersKeys.length; i++) {
      // only add to dropdown if trigger hasn't yet been used (but always include Score Reached, as multiple of these are ok)
      if (currentTriggers.findIndex(t => t.trigger === this.availableTriggersValues[i].toString()) === -1){
              availableTriggers.push({
                Value: this.availableTriggersKeys[i].toString(),
                Text: this.availableTriggersValues[i].toString()
              } as DropdownListItem);
          }
    }
    this.availableTriggersDropdown.set(availableTriggers);
  }

  addTrigger() {
    // duplicate check
    const newTrigger = this.getEnumValueFromKey(AvailableTriggersFarkle, this.newTrigger());
    const newScript = this.availableScripts.find(x => x.EntityId === this.newTriggerScript())!.Name;
   
    for (const trigger of this.triggers()) {
      if (trigger.trigger === newTrigger){
        this.duplicateTriggerWarning.set(true);
        return;
      }
    }

    this.duplicateTriggerWarning.set(false);
    this.triggers.update(values => [...values, 
      { 
        id: new Date().toISOString(), 
        trigger: newTrigger, 
        script: newScript
      } as IScriptTrigger]);
      this.settingsService.saveTriggers(SettingsType.Farkle, this.triggers());
      this.updateAvailableTriggers();
  }

  deleteTrigger(id: string) {
    let triggers = [...this.triggers()];
    triggers = triggers.filter(t => t.id !== id);
    this.triggers.set(triggers);
    this.settingsService.saveTriggers(SettingsType.Farkle, this.triggers());
    this.updateAvailableTriggers();
  }

    runTrigger(trigger : AvailableTriggersFarkle){
      const scriptName = this.triggers().find(t => t.script && t.trigger === trigger)?.script ?? null;
      const entityId = this.availableScripts.find(s => s.Name === scriptName)!.EntityId;
      if (entityId) {
        this.apiService.runScript(entityId).subscribe({
          next: (_response) => {},
          error: (err) => {
            console.log("Api error:", err);
          }
      });
    }
  }

  resetSettings() {
    this.settings = this.settingsService.defaultSettings(SettingsType.Farkle) as ISettingsFarkle;
  }

  saveSettings() {
    this.dialogSettings.nativeElement.close();
    this.settingsService.saveGameSettings(SettingsType.Farkle, this.settings);
  }

  saveTriggers() {
    this.dialogScriptSettings.nativeElement.close();
    this.settingsService.saveTriggers(SettingsType.Farkle, this.triggers());
  }

  getEnumValueFromKey<T extends object>(enumObject: T, key: string): T[keyof T] | undefined {
    return enumObject[key as keyof T];
  }

  getEnumKeyFromValue<T extends object>(enumObject: T, value: T[keyof T]): keyof T | undefined {
    return Object.keys(enumObject).find(key => enumObject[key as keyof T] === value) as keyof T | undefined;
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
