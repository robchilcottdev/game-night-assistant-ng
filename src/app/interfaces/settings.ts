import { AvailableTriggersFarkle } from "./enums"

export interface IScriptTrigger {
    id: string,
    trigger: AvailableTriggersFarkle,
    amount?: number,
    script: string
}

export interface ISettings {
    allowNegativeScores: boolean,
    autoAdvanceOnScoreUpdate: boolean,
    autoOpenEditScoreOnAdvance: boolean,
    targetScore?: number,
    startingScore?: number
}

export interface ISettingsFarkle extends ISettings {
    targetScore?: number,
    minimumPointsToStart: number,
    threeFarklePenalty: number
}


export interface ISettingsGeneric extends ISettings {
    
}

export interface ISettingsSkullKing extends ISettings {
    
}

export enum SettingsType {
    Generic,
    Farkle,
    SkullKing
}

