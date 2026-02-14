import { inject, Injectable } from '@angular/core';
import { LocalStorage } from '../interfaces/enums';
import { IAvailableScript } from '../interfaces/api-result-entity-state';
import { ISettings, ISettingsFarkle, ISettingsGeneric, SettingsType } from '../interfaces/settings';
import { HaApiService } from './api-service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  protected apiService = inject(HaApiService);

  public getGameSettings(settingsType: SettingsType): ISettingsGeneric | ISettingsFarkle {
    let storedSettings;
    switch (settingsType) {
      case SettingsType.Generic:
        storedSettings = localStorage.getItem(LocalStorage.gnaSettingsGeneric);
        break;
      case SettingsType.Farkle:
        storedSettings = localStorage.getItem(LocalStorage.gnaSettingsFarkle);
        break;
      default:
        break;
    }

    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
    return this.defaultSettings(settingsType);
  }

  public saveGameSettings(settingsType: SettingsType, settingsToStore: ISettings) {
    switch (settingsType) {
      case SettingsType.Generic:
        return localStorage.setItem(LocalStorage.gnaSettingsGeneric, JSON.stringify(settingsToStore));
      case SettingsType.Farkle:
        return localStorage.setItem(LocalStorage.gnaSettingsFarkle, JSON.stringify(settingsToStore));
    }
  }

  public defaultSettings(settingsType: SettingsType): ISettingsGeneric | ISettingsFarkle {
    switch (settingsType) {
      case SettingsType.Generic:
        return {
          allowNegativeScores: false,
          autoOpenEditScoreOnAdvance: false,
          autoAdvanceOnScoreUpdate: true
        } as ISettingsGeneric;
      case SettingsType.Farkle:
        return {
          allowNegativeScores: false,
          autoAdvanceOnScoreUpdate: true,
          autoOpenEditScoreOnAdvance: false,
          minimumPointsToStart: 500,
          targetScore: 10000,
          threeFarklePenalty: 1000
        } as ISettingsFarkle
    }
  }
}
