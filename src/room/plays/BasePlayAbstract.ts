import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import WithStateStore from "../classes/WithStateStore";
import { PlayerObject, Position, PlayerObjFlat } from "../HBClient";
import FieldGoal from "./FieldGoal";
import KickOff from "./Kickoff";
import { FieldGoalStore } from "./play_events/FieldGoal.events";
import { KickOffStore } from "./play_events/KickOff.events";
import { PuntStore } from "./play_events/Punt.events";
import { SnapStore } from "./play_events/Snap.events";
import Punt from "./Punt";
import Snap from "./Snap";

export type PLAY_TYPES = Snap | FieldGoal | KickOff | Punt;

type PlayStorages = SnapStore & FieldGoalStore & PuntStore & KickOffStore;

export type PlayStorageKeys = keyof PlayStorages | "twoPointAttempt";

export default abstract class BasePlayAbstract<T> extends WithStateStore<
  T,
  PlayStorageKeys
> {
  /**
   * Validation before the game sets the play
   * @return Throws a GameCommandError in the case of an error
   */
  abstract validateBeforePlayBegins(player: PlayerObject | null): never | void;

  /**
   * Prepares aspects such as player and ball position before the play is run.
   *
   * Anything that deals with Game state must be dealt with here
   */
  abstract prepare(): void;

  /**
   * Begins live play
   */
  abstract run(): void;

  /**
   * Cleans up any variables from the current play
   */
  abstract cleanUp(): void;

  /* Game Tick Events */

  /**
   * Handle ball out of bounds
   */
  abstract onBallOutOfBounds(ballPosition: Position): void;

  /**
   * Handle ball carrier out of bounds
   */
  abstract onBallCarrierOutOfBounds(ballCarrierPosition: Position): void;

  /**
   * Handle offense touching ball carrier (runs)
   */
  abstract onBallCarrierContactOffense(playerContact: PlayerContact): void;

  /**
   * Handle defense touching ball carrier (tackles)
   */
  abstract onBallCarrierContactDefense(playerContact: PlayerContact): void;

  /**
   * Handle a drag on a kick
   */
  abstract onKickDrag(player: PlayerObjFlat | null): void;
  /**
   * Handle offensive player touching the ball
   */
  protected abstract _onBallContactOffense(ballContactObj: BallContact): void;

  /**
   * Handle defensive player touching the ball
   */
  protected abstract _onBallContactDefense(ballContactObj: BallContact): void;
}
