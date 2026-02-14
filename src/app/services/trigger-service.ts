import { inject, Injectable } from '@angular/core';
import { IScriptTrigger, SettingsType } from '../interfaces/settings';
import { AvailableTriggersFarkle, AvailableTriggersGeneric, LocalStorage } from '../interfaces/enums';
import { HaApiService } from './api-service';
import { IAvailableScript } from '../interfaces/api-result-entity-state';

@Injectable({
  providedIn: 'root',
})
export class TriggerService {
  protected apiService = inject(HaApiService);


  public getAvailableScripts(): IAvailableScript[] {
    const scriptsFromStorage = localStorage.getItem(LocalStorage.gnaAvailableScripts);
    if (!scriptsFromStorage) return [];
    let unfilteredScripts: IAvailableScript[] = JSON.parse(scriptsFromStorage);
    return unfilteredScripts.filter(s => s.Active);
  }

  public getTriggers(settingsType: SettingsType): Array<IScriptTrigger> {
    let storageKey = "";
    switch (settingsType) {
      case SettingsType.Generic: storageKey = LocalStorage.gnaScriptTriggersGeneric; break;
      case SettingsType.Farkle: storageKey = LocalStorage.gnaScriptTriggersFarkle; break;
      default: break;
    }
    let storedTriggers = localStorage.getItem(storageKey);
    if (!storedTriggers) return [];

    return JSON.parse(storedTriggers);
  }

  runTrigger(triggerType: AvailableTriggersGeneric | AvailableTriggersFarkle) {  
    const availableScripts = this.getAvailableScripts();
    const triggers = this.getTriggers(this.getSettingsTypeFromTriggerType(triggerType));
    
    const scriptName = triggers.find(t => t.trigger === triggerType)?.script ?? null;

    if (scriptName) {
      const entityId = availableScripts.find(s => s.Name === scriptName)!.EntityId;
      if (entityId) {
        this.apiService.runScript(entityId).subscribe({
          next: (_response) => { },
          error: (err) => {
            console.log("Api error:", err);
          }
        });
      }
    }
  }

  public saveTriggers(settingsType: SettingsType, triggers: Array<IScriptTrigger>): void {
    let storageKey = "";
    switch (settingsType) {
      case SettingsType.Generic: storageKey = LocalStorage.gnaScriptTriggersGeneric; break;
      case SettingsType.Farkle: storageKey = LocalStorage.gnaScriptTriggersFarkle; break;
      default: break;
    }
    localStorage.setItem(storageKey, JSON.stringify(triggers));
  }

  private getSettingsTypeFromTriggerType(triggerType : AvailableTriggersGeneric | AvailableTriggersFarkle){
    if (Object.values(AvailableTriggersGeneric).includes(triggerType as AvailableTriggersGeneric)) return SettingsType.Generic;
    // vile shortcut for now ;)
    return SettingsType.Farkle;
  }
}
