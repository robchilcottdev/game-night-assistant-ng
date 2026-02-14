import { Component, inject, OnInit, output, signal } from '@angular/core';
import { IScriptTrigger, SettingsType } from '../../interfaces/settings';
import { TriggerService } from '../../services/trigger-service';
import { FormsModule } from '@angular/forms';
import { DropdownListItem } from '../../interfaces/dropdown-list';
import { AvailableTriggersFarkle } from '../../interfaces/enums';
import { IAvailableScript } from '../../interfaces/api-result-entity-state';

@Component({
  selector: 'app-trigger-settings',
  imports: [FormsModule],
  templateUrl: './trigger-settings.html',
  styleUrl: './trigger-settings.css',
})
export class TriggerSettings implements OnInit {
  protected triggerService = inject(TriggerService);

  protected closeDialogRequested = output<void>();

  protected availableScripts: Array<IAvailableScript> = [];
  protected triggers = signal<IScriptTrigger[]>([]);
  protected newTrigger = signal("");
  protected newTriggerScript = signal("");
  protected duplicateTriggerWarning = signal(false);
  protected availableTriggersKeys = Object.keys(AvailableTriggersFarkle);
  protected availableTriggersValues = Object.values(AvailableTriggersFarkle);
  protected availableTriggersDropdown = signal<DropdownListItem[]>([]);

  ngOnInit(): void {
    this.availableScripts = this.triggerService.getAvailableScripts();
    // gets current triggers for this game type from local storage if available
    this.triggers.set(this.triggerService.getTriggers(SettingsType.Farkle));
    this.updateAvailableTriggers();
  }

  addTrigger() {
    // duplicate check
    const newTrigger = this.getEnumValueFromKey(AvailableTriggersFarkle, this.newTrigger());
    const newScript = this.availableScripts.find(x => x.EntityId === this.newTriggerScript())!.Name;

    for (const trigger of this.triggers()) {
      if (trigger.trigger === newTrigger) {
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
    this.triggerService.saveTriggers(SettingsType.Farkle, this.triggers());
    this.updateAvailableTriggers();
  }

  updateAvailableTriggers() {
    let availableTriggers: DropdownListItem[] = [];
    const currentTriggers = this.triggerService.getTriggers(SettingsType.Farkle);

    for (let i = 0; i < this.availableTriggersKeys.length; i++) {
      // only add to dropdown if trigger hasn't yet been used (but always include Score Reached, as multiple of these are ok)
      if (currentTriggers.findIndex(t => t.trigger === this.availableTriggersValues[i].toString()) === -1) {
        availableTriggers.push({
          Value: this.availableTriggersKeys[i].toString(),
          Text: this.availableTriggersValues[i].toString()
        } as DropdownListItem);
      }
    }
    this.availableTriggersDropdown.set(availableTriggers);
  }

  runTrigger(triggerType: AvailableTriggersFarkle) {
    this.triggerService.runTrigger(triggerType);
  }

  saveTriggers() {
    this.triggerService.saveTriggers(SettingsType.Farkle, this.triggers());
    this.closeDialogRequested.emit();
  }

  deleteTrigger(id: string) {
    let triggers = [...this.triggers()];
    triggers = triggers.filter(t => t.id !== id);
    this.triggers.set(triggers);
    this.triggerService.saveTriggers(SettingsType.Farkle, this.triggers());
    this.updateAvailableTriggers();
  }

  getEnumValueFromKey<T extends object>(enumObject: T, key: string): T[keyof T] | undefined {
    return enumObject[key as keyof T];
  }

  getEnumKeyFromValue<T extends object>(enumObject: T, value: T[keyof T]): keyof T | undefined {
    return Object.keys(enumObject).find(key => enumObject[key as keyof T] === value) as keyof T | undefined;
  }

}
