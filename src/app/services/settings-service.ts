import { inject, Injectable } from '@angular/core';
import { LocalStorage } from '../interfaces/enums';
import { ISettings, ISettingsFarkle, ISettingsGeneric, ISettingsSkullKing, SettingsType } from '../interfaces/settings';
import { HaApiService } from './api-service';
import { GameStateFarkle, GameStateGeneric, GameStateSkullKing } from '../interfaces/game-state';

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

  public defaultSettings(settingsType: SettingsType): ISettingsGeneric | ISettingsFarkle | ISettingsSkullKing {
    switch (settingsType) {
      case SettingsType.Generic:
        return {          
          allowNegativeScores: false,
          autoOpenEditScoreOnAdvance: false,
          autoAdvanceOnScoreUpdate: true,
          startingScore: undefined,
          targetScore: undefined
        } as ISettingsGeneric;
      case SettingsType.Farkle:
        return {
          allowNegativeScores: false,
          autoAdvanceOnScoreUpdate: true,
          autoOpenEditScoreOnAdvance: false,
          minimumPointsToStart: 500,
          targetScore: 10000,
          threeFarklePenalty: 1000
        } as ISettingsFarkle;
      case SettingsType.SkullKing:
        return {          
          allowNegativeScores: false,
          autoOpenEditScoreOnAdvance: false,
          autoAdvanceOnScoreUpdate: true,
          startingScore: undefined,
          targetScore: undefined
        } as ISettingsGeneric;
    }
  }

  public saveGameState(settingsType : SettingsType, gameState : GameStateGeneric | GameStateFarkle | GameStateSkullKing) : void {
    switch (settingsType) {
      case SettingsType.Generic:
        return localStorage.setItem(LocalStorage.gnaGameStateGeneric, JSON.stringify(gameState));
      case SettingsType.Farkle:
        return localStorage.setItem(LocalStorage.gnaGameStateFarkle, JSON.stringify(gameState));
      case SettingsType.SkullKing:
        return localStorage.setItem(LocalStorage.gnaGameStateSkullKing, JSON.stringify(gameState));         
    }
  }

  public loadGameState(settingsType : SettingsType) : GameStateGeneric | GameStateFarkle | GameStateSkullKing | undefined {
    switch (settingsType) {
      case SettingsType.Generic:
        if (localStorage.getItem(LocalStorage.gnaGameStateGeneric)) {
          return JSON.parse(localStorage.getItem(LocalStorage.gnaGameStateGeneric)!);
        }
        break;
      case SettingsType.Farkle:
        if (localStorage.getItem(LocalStorage.gnaGameStateFarkle)) {
          return JSON.parse(localStorage.getItem(LocalStorage.gnaGameStateFarkle)!);
        }
        break;
            case SettingsType.Farkle:
        if (localStorage.getItem(LocalStorage.gnaGameStateSkullKing)) {
          return JSON.parse(localStorage.getItem(LocalStorage.gnaGameStateSkullKing)!);
        }
        break;
      default:
        break; 
    }
    return undefined;
  }
}
