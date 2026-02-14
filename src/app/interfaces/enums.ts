export enum PlayDirection {
    Clockwise,
    Anticlockwise
}

export enum LocalStorage {
    gnaAvailableScripts = 'gna-available-scripts',
    gnaSettingsGeneric = 'gna-settings-generic',
    gnaSettingsFarkle = 'gna-settings-farkle',
    gnaScriptTriggersFarkle = 'gna-script-triggers-farkle',
    gnaScriptTriggersGeneric = 'gna-script-triggers-generic',
    gnaGameStateGeneric = 'gna-state-generic',
    gnaGameStateFarkle = 'gna-state-farkle'
}

export enum AvailableTriggersFarkle {
    TargetScoreReached = "Target scored reached",
    FirstPlayerSelected = "First player selected",
    ScoreIncrease = "Score increases",
    ScoreDecrease = "Score decreases",
    PlayerAdded = "Player added",
    Farkle = "Farkle rolled",
    TwoFarkles = "Two farkles rolled",
    ThreeFarkles = "Three farkles rolled",
    FourOfAKindScored = "Four of a kind scored",
    FiveOfAKindScored = "Five of a kind scored",
    SixOfAKindScored = "Six of a kind scored",
    StraightScored = "Straight scored",
    ThreePairsScores = "Three pairs scored",
    TwoTripletsScored = "Two triplets scored",
    FarkleCleared = "Farkle cleared"
}

export enum AvailableTriggersGeneric {
    TargetScoreReached = "Target scored reached",
    FirstPlayerSelected = "First player selected",
    ScoreIncrease = "Score increases",
    ScoreDecrease = "Score decreases",
    ZeroScored = "Zero scored",
    PlayerAdded = "Player added",
    PlayerRemoved = "Player removed"
}