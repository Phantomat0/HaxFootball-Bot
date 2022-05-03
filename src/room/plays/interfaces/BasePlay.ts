import { PlayableTeamId, Position } from "../../HBClient";
import { flattenPlayer } from "../../utils/haxUtils";

export default interface IBasePlay {
  _isLivePlay: boolean;
  _ballCarrier: ReturnType<typeof flattenPlayer> | null;
  _ballPositionOnSet: Position | null;
  _startingPosition: Position;
  time: number;

  setBallCarrier(player: ReturnType<typeof flattenPlayer>): void;

  /**
   * Returns the ball carrier. Use when the ball carrier is defined
   * @returns The ball carrier, or an error if not defined
   */
  getBallCarrier(): ReturnType<typeof flattenPlayer> | never;

  /**
   * Returns the ball carrier, will return null if not defined
   */
  getBallCarrierSafe(): ReturnType<typeof flattenPlayer> | null;

  get isLivePlay(): boolean;

  _setLivePlay(bool: boolean): void;

  getBallPositionOnSet(): Position | null;

  setBallPositionOnSet(position: Position): this;

  positionBallAndFieldMarkers(): this;

  scorePlay(
    score: number,
    team: PlayableTeamId,
    teamEndZoneToScore: PlayableTeamId
  ): void;

  endPlay(): void;
}
