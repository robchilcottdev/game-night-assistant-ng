export interface IPlayer {
    Id: number;
    Name: string;
    Score: number;
    IsStartingPlayer: boolean;
    Active: boolean;
}

export interface IFarklePlayer extends IPlayer {
    Farkles: number;
    HasStarted: boolean;
}

export interface ISkullKingPlayer extends IPlayer {
    rounds: ISkullKingRound[]
}

export interface ISkullKingRound {
    bid: number,
    bidSet: boolean,
    made: number,
    bidPoints: number,
    bonusPoints: number,
    started: boolean,
    complete: boolean
}