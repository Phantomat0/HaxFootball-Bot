import BallContact from "../classes/BallContact";
import Room from "../roomStructures/Room";
import Snap, { SNAP_PLAY_STATES } from "./snap";

export type Play = Snap;

export default abstract class BasePlay<T extends string> {
  private _state: { [key in T]: boolean } = {} as { [key in T]: boolean };
  protected _isLivePlay: boolean = false;

  setState(state: T, value: boolean = true) {
    this._state[state] = value;
  }

  readState(state: T) {
    return this._state[state];
  }

  /**
   * Only used for event listeners
   */
  readStateUnsafe(state: PLAY_STATES) {
    return this._state[state];
  }

  get isLivePlay() {
    return this._isLivePlay;
  }

  protected _setLivePlay(bool: boolean) {
    this._isLivePlay = bool;
  }

  handleBallContact(ballContactObj: BallContact) {
    if (ballContactObj.player.team === Room.offensiveTeam)
      return this._handleBallContactOffense(ballContactObj);
    return this._handleBallContactDefense(ballContactObj);
  }
  protected abstract _handleBallContactOffense(
    ballContactObj: BallContact
  ): void;
  protected abstract _handleBallContactDefense(
    ballContactObj: BallContact
  ): void;

  /* EVENTS */
}

type FG_PLAY_STATES = "fieldGoal" | "fieldGoalKicked" | "fieldGoalBlitzed";

type KICK_OFF_PLAY_STATES = "kickOff" | "kickOffCaught";

type PUNT_PLAY_STATES = "punt" | "puntCaught";

export type PLAY_STATES =
  | SNAP_PLAY_STATES
  | FG_PLAY_STATES
  | KICK_OFF_PLAY_STATES
  | PUNT_PLAY_STATES
  | "always";
