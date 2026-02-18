import { PlayDirection } from "./enums";
import { ILogItem } from "./logItem";
import { IFarklePlayer, IPlayer, ISkullKingPlayer } from "./player";

export interface GameState {
    log: ILogItem[],
    currentPlayerIndex: number,
    selectedPlayerId: number,
    currentEditedPlayerScore?: number
}

export interface GameStateGeneric extends GameState {
    players: IPlayer[],
    playDirection: PlayDirection
}

export interface GameStateFarkle extends GameState {
    players: IFarklePlayer[]
}

export interface GameStateSkullKing extends GameState {
    players: ISkullKingPlayer[]
}
