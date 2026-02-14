import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { IScriptTrigger, SettingsType } from '../../interfaces/settings';
import { TriggerService } from '../../services/trigger-service';
import { FormsModule } from '@angular/forms';
import { DropdownListItem } from '../../interfaces/dropdown-list';
import { AvailableTriggersFarkle, AvailableTriggersGeneric } from '../../interfaces/enums';
import { IAvailableScript } from '../../interfaces/api-result-entity-state';

@Component({
  selector: 'app-trigger-settings',
  imports: [FormsModule],
  templateUrl: './trigger-settings.html',
  styleUrl: './trigger-settings.css',
})
export class TriggerSettings implements OnInit {
  protected triggerService = inject(TriggerService);

  public settingsType = input<SettingsType>();
  protected closeDialogRequested = output<void>();

  protected availableScripts: Array<IAvailableScript> = [];
  protected triggers = signal<IScriptTrigger[]>([]);
  protected newTrigger = signal("");
  protected newTriggerAmount = signal<number | undefined>(undefined);
  protected newTriggerScript = signal("");
  protected duplicateTriggerWarning = signal(false);

  protected availableTriggersDropdown = signal<DropdownListItem[]>([]);
  
  // only include the "target amount" box for the trigger if the trigger calls for it (e.g. TargetScoreReached)
  protected showTriggerAmount = computed(() => {
    const availableTriggers = this.getAvailableTriggersTypeFromSettingsType(this.settingsType()!);
    if (availableTriggers === AvailableTriggersGeneric) {
      if (this.newTrigger() === this.getEnumKeyFromValue(availableTriggers, availableTriggers.TargetScoreReached)){
        return true;
      }
    }
    return false;
  });

  ngOnInit(): void {
    this.availableScripts = this.triggerService.getAvailableScripts();
    // gets current triggers for this game type from local storage if available
    this.triggers.set(this.triggerService.getTriggers(this.settingsType()!));
    this.updateAvailableTriggers();
  }

  addTrigger() {
    // duplicate check
    const newTrigger = this.getEnumValueFromKey(this.availableTriggersTypeFromSettingsType()!, this.newTrigger());
    const newScript = this.availableScripts.find(x => x.EntityId === this.newTriggerScript())!.Name;
    const newAmount = this.newTriggerAmount();

    for (const trigger of this.triggers()) {
      if (trigger.trigger === newTrigger && trigger.amount === newAmount) {
        this.duplicateTriggerWarning.set(true);
        return;
      }
    }

    this.duplicateTriggerWarning.set(false);
    this.triggers.update(values => [...values,
    {
      id: new Date().toISOString(),
      trigger: newTrigger,
      amount: this.newTriggerAmount(),
      script: newScript
    } as IScriptTrigger]);
    this.triggerService.saveTriggers(this.settingsType()!, this.triggers());
    this.updateAvailableTriggers();
  }

  getAvailableTriggersTypeFromSettingsType(settingsType: SettingsType):
    typeof AvailableTriggersGeneric | typeof AvailableTriggersFarkle | undefined {
    switch (settingsType) {
      case SettingsType.Generic:
        return AvailableTriggersGeneric;
      case SettingsType.Farkle:
        return AvailableTriggersFarkle;
      default: return undefined;
    }
  }

  updateAvailableTriggers() {
    let availableTriggers: DropdownListItem[] = [];
    const availableTriggersKeys = Object.keys(this.availableTriggersTypeFromSettingsType()!);
    const availableTriggersValues = Object.values(this.availableTriggersTypeFromSettingsType()!);
    
    const currentTriggers = this.triggerService.getTriggers(this.settingsType()!);

    for (let i = 0; i < availableTriggersKeys.length; i++) {
      // only add to dropdown if trigger hasn't yet been used (but always include Score Reached, as multiple of these are ok)
      if (currentTriggers.findIndex(t => t.trigger === availableTriggersValues[i].toString()) === -1
    || [AvailableTriggersGeneric.TargetScoreReached].includes(availableTriggersValues[i].toString())) {
        availableTriggers.push({
          Value: availableTriggersKeys[i].toString(),
          Text: availableTriggersValues[i].toString()
        } as DropdownListItem);
      }
    }
    this.availableTriggersDropdown.set(availableTriggers);
  }

  runTrigger(triggerType: AvailableTriggersFarkle | AvailableTriggersGeneric) {
    this.triggerService.runTrigger(triggerType);
  }

  saveTriggers() {
    this.triggerService.saveTriggers(this.settingsType()!, this.triggers());
    this.closeDialogRequested.emit();
  }

  deleteTrigger(id: string) {
    let triggers = [...this.triggers()];
    triggers = triggers.filter(t => t.id !== id);
    this.triggers.set(triggers);
    this.triggerService.saveTriggers(this.settingsType()!, this.triggers());
    this.updateAvailableTriggers();
  }

    availableTriggersTypeFromSettingsType() {
    switch (this.settingsType()) {
      case SettingsType.Generic: return AvailableTriggersGeneric;
      case SettingsType.Farkle: return AvailableTriggersFarkle;
      default:
        return undefined;
    }
  };

  getEnumValueFromKey<T extends object>(enumObject: T, key: string): T[keyof T] | undefined {
    return enumObject[key as keyof T];
  }

  getEnumKeyFromValue<T extends object>(enumObject: T, value: T[keyof T]): keyof T | undefined {
    return Object.keys(enumObject).find(key => enumObject[key as keyof T] === value) as keyof T | undefined;
  }

}
