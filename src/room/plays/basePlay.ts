import Room from "..";
import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import { PlayerObject, Position } from "../HBClient";
import Chat from "../roomStructures/Chat";
import Ball from "../structures/Ball";
import { MAP_POINTS } from "../utils/map";
import Snap, { SNAP_PLAY_STATES } from "./Snap";

export type Play = Snap;

export default abstract class BasePlay<T extends string> {
  private _state: { [key in T]: boolean } = {} as { [key in T]: boolean };
  protected _isLivePlay: boolean = false;
  protected _ballCarrier: PlayerObject | null = null;
  protected _ballPositionOnSet: Position | null = null;
  time: number;

  constructor(time: number) {
    this.time = Math.round(time);
  }

  setState(state: T, value: boolean = true) {
    this._state[state] = value;
  }

  readState(state: T) {
    return this._state[state] ?? null;
  }

  /**
   * Only used for event listeners
   */
  readStateUnsafe(state: PLAY_STATES) {
    return this._state[state];
  }

  setBallCarrier(player: PlayerObject) {
    this._ballCarrier = player;
    return this;
  }

  /**
   * Returns the ball carrier. Use when the ball carrier is defined
   * @returns The ball carrier, or an error if not defined
   */
  getBallCarrier() {
    if (!this._ballCarrier)
      throw Error("Game Error: Ball Carrier could not be found");
    return this._ballCarrier;
  }

  /**
   * Returns the ball carrier, will return null if not defined
   */
  getBallCarrierSafe() {
    return this._ballCarrier;
  }

  get isLivePlay() {
    return this._isLivePlay;
  }

  protected _setLivePlay(bool: boolean) {
    this._isLivePlay = bool;
  }

  /* EVENTS */

  /*
  handleBallContact
  handleBallOutOfBounds





  */

  handleBallContact(ballContactObj: BallContact) {
    const {
      player: { team },
    } = ballContactObj;

    return team === Room.game.offenseTeamId
      ? this._handleBallContactOffense(ballContactObj)
      : this._handleBallContactDefense(ballContactObj);
  }
  protected abstract _handleBallContactOffense(
    ballContactObj: BallContact
  ): void;
  protected abstract _handleBallContactDefense(
    ballContactObj: BallContact
  ): void;

  abstract handleBallOutOfBounds(ballPosition: Position);
  abstract handleBallCarrierOutOfBounds(ballCarrierPosition: Position);
  abstract handleTouchdown();
  abstract handleBallCarrierContactOpposingTeam(playerContact: PlayerContact);
  abstract handleBallCarrierContactSameTeam(playerContact: PlayerContact);

  handleSafety() {
    this._setLivePlay(false);
    Chat.send("SAFETY!!!");
    Ball.score(Room.game.defenseTeamId);

    const offenseEndZone = getTeamEndzone(game.getOffenseTeam());
    const offenseTwentyYardLine = new DistanceCalculator([
      offenseEndZone,
      MAP_POINTS.YARD * 20,
    ])
      .addByTeam(game.getOffenseTeam())
      .getDistance();
    game.setState("kickOffPosition", offenseTwentyYardLine);
  }
}

type FG_PLAY_STATES = "fieldGoal" | "fieldGoalKicked" | "fieldGoalBlitzed";

type KICK_OFF_PLAY_STATES = "kickOff" | "kickOffCaught";

export type PLAY_STATES =
  | SNAP_PLAY_STATES
  | FG_PLAY_STATES
  | KICK_OFF_PLAY_STATES
  | PUNT_PLAY_STATES
  | "always";
