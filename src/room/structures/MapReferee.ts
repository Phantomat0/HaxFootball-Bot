import { PlayableTeamId, PlayerObject, Position } from "../HBClient";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import { MAP_POINTS } from "../utils/map";
import { TEAMS } from "../utils/types";
import { extrapolateLine } from "../utils/utils";
import DistanceCalculator from "./DistanceCalculator";
import PreSetCalculators from "./PreSetCalculators";

/**
 * Handles all HFL Map Logic and Calculations
 */
class MapReferee {
  private _checkIfOutOfBounds(objectToCheck: Position, objectRadius: number) {
    const { x, y } = objectToCheck;
    // Adjust for Ball Radius
    const { topSideLine, botSideLine, redSideLine, blueSideLine } =
      PreSetCalculators.adjustMapCoordinatesForRadius(objectRadius);
    return (
      y < topSideLine || y > botSideLine || x < redSideLine || x > blueSideLine
    );
  }

  /**
   * Finds a player that is offside
   */
  findTeamPlayerOffside(
    players: PlayerObject[],
    team: PlayableTeamId,
    losX: Position["x"]
  ) {
    const offsidePlayer = players.find((player) => {
      const { position } = getPlayerDiscProperties(player.id)!;
      const { x } = PreSetCalculators.adjustPlayerPositionFront(position, team);
      const isOnside = this.checkIfBehind(x, losX, team);
      return !isOnside;
    });

    return offsidePlayer;
  }

  /**
   * Returns an offside player from a team, without adjusting player position
   */
  findTeamPlayerOffsideNoAdjust(
    players: PlayerObject[],
    team: PlayableTeamId,
    pointToBeBehind: Position["x"]
  ) {
    const offsidePlayer = players.find((player) => {
      const {
        position: { x },
      } = getPlayerDiscProperties(player.id)!;
      const isOnside = this.checkIfBehind(x, pointToBeBehind, team);
      return !isOnside;
    });

    return offsidePlayer;
  }

  findAllTeamPlayerOffside(
    players: PlayerObject[],
    team: PlayableTeamId,
    pointToBeBehind: Position["x"]
  ) {
    const offsidePlayers = players.filter((player) => {
      const {
        position: { x },
      } = getPlayerDiscProperties(player.id)!;

      const adjustedX = new DistanceCalculator()
        .addByTeam(x, MAP_POINTS.PLAYER_RADIUS, team)
        .calculate();

      const isOnside = this.checkIfBehind(adjustedX, pointToBeBehind, team);
      return isOnside === false;
    });

    return offsidePlayers;
  }

  getEndZonePositionIsIn = (position: Position) => {
    const { RED_GOAL_LINE, BLUE_GOAL_LINE } = MAP_POINTS;

    if (position.x <= RED_GOAL_LINE) return 1;
    if (position.x >= BLUE_GOAL_LINE) return 2;
    return null;
  };

  checkIfPlayerOutOfBounds(position: Position) {
    // We have to adjust the player position
    const isOutOfBounds = this._checkIfOutOfBounds(
      position,
      MAP_POINTS.PLAYER_RADIUS
    );
    return isOutOfBounds ? position : null;
  }

  checkIfBallOutOfBounds = (ballPosition: Position) => {
    const isOutOfBounds = this._checkIfOutOfBounds(
      ballPosition,
      MAP_POINTS.BALL_RADIUS
    );
    return isOutOfBounds ? ballPosition : null;
  };

  checkIfBallInFrontOfLOS(
    ballPosition: Position,
    losX: number,
    offenseTeamId: PlayableTeamId
  ) {
    const isInFront = this.checkIfInFront(ballPosition.x, losX, offenseTeamId);

    return isInFront;
  }

  checkIfBallDragged(
    ballPositionOnSet: Position,
    ballPosition: Position,
    maxDragDistance: number
  ) {
    const dragAmount = new DistanceCalculator()
      .calcDifference3D(ballPositionOnSet, ballPosition)
      .calculate();

    return dragAmount > maxDragDistance;
  }

  /**
   * Returns the endzone the x position is in, or null if not in redzone
   */
  checkIfInRedzone(x: Position["x"]) {
    if (x >= MAP_POINTS.BLUE_REDZONE) return TEAMS.BLUE;
    if (x <= MAP_POINTS.RED_REDZONE) return TEAMS.RED;
    return null;
  }

  checkIfBehind(x1: Position["x"], x2: Position["x"], team: PlayableTeamId) {
    return team === TEAMS.RED ? x1 <= x2 : x1 >= x2;
  }

  checkIfInFront(x1: Position["x"], x2: Position["x"], team: PlayableTeamId) {
    return team === TEAMS.RED ? x1 >= x2 : x1 <= x2;
  }

  checkIfBallBetweenHashes(position: Position) {
    const { topHash, botHash } =
      PreSetCalculators.adjustMapCoordinatesForRadius(MAP_POINTS.BALL_RADIUS);

    return this.checkIfBetweenY(position.y, topHash, botHash);
  }

  checkIfBallBetweenFGPosts(position: Position) {
    const { topFG, botFG } = PreSetCalculators.adjustMapCoordinatesForRadius(
      MAP_POINTS.BALL_RADIUS
    );

    return this.checkIfBetweenY(position.y, topFG, botFG);
  }

  checkIfBallCompletelyOutOfBounds(ballPosition: Position) {
    const { x, y } = ballPosition;

    const { TOP_SIDELINE, BOT_SIDELINE, RED_SIDELINE, BLUE_SIDELINE } =
      MAP_POINTS;

    const ballDiameter = MAP_POINTS.BALL_RADIUS * 2;

    const topSideLine = TOP_SIDELINE - ballDiameter;
    const botSideLine = BOT_SIDELINE + ballDiameter;
    const redSideLine = RED_SIDELINE - ballDiameter;
    const blueSideLine = BLUE_SIDELINE + ballDiameter;

    return (
      y < topSideLine || y > botSideLine || x < redSideLine || x > blueSideLine
    );
  }

  checkIfBetweenY(yToCheck: number, yTop: number, yBottom: number) {
    return yToCheck >= yTop && yToCheck <= yBottom;
  }

  checkIfWithinHash(position: Position, radius: number) {
    const { y } = position;
    const { topHash, botHash } =
      PreSetCalculators.adjustMapCoordinatesForRadius(radius);

    return y > topHash && y < botHash;
  }

  checkIfBallIsHeadedInIntTrajectory(
    ballXSpeed: number,
    ballPositionOnFirstTouch: Position,
    ballPosition: Position
  ) {
    const { TOP_FG_POST, BOTTOM_FG_POST, RED_SIDELINE, BLUE_SIDELINE } =
      MAP_POINTS;
    // To determine which way the ball is moving, we use the ballXSpeed

    const sideLineBallIsApproaching =
      ballXSpeed < 0 ? RED_SIDELINE : BLUE_SIDELINE;

    const positionBallWillMeetTeamSideLine = extrapolateLine(
      ballPositionOnFirstTouch,
      ballPosition,
      sideLineBallIsApproaching
    );

    // All we have to do is now check that that position is inbounds

    const willBeAGoodInt = this.checkIfBetweenY(
      positionBallWillMeetTeamSideLine.y,
      TOP_FG_POST,
      BOTTOM_FG_POST
    );

    if (willBeAGoodInt) return false;
    return true;
  }

  checkIfBallIsMoving(BallSpeed: { xspeed: number; yspeed: number }) {
    const BALL_DEAD_SPEED = 0.05;
    const { xspeed } = BallSpeed;

    // xpseed can be negative, so make sure you get absoltue value
    return Math.abs(xspeed) > BALL_DEAD_SPEED;
  }

  getTeamEndzone(teamId: PlayableTeamId) {
    return teamId === TEAMS.RED
      ? MAP_POINTS.RED_GOAL_LINE
      : MAP_POINTS.BLUE_GOAL_LINE;
  }

  getOpposingTeamEndzone = (teamId: PlayableTeamId) => {
    return teamId === TEAMS.RED
      ? MAP_POINTS.BLUE_GOAL_LINE
      : MAP_POINTS.RED_GOAL_LINE;
  };

  /**
   *
   * @param positionArray An array of positions
   * @param positionToCheck The position to check and compare
   * @returns Returns the index of the position that is closest, and the positional difference, will return -1 index if no matches
   */
  getClosestPositionToOtherPosition(
    positionArray: Position[],
    positionToCheck: Position
  ) {
    return positionArray.reduce(
      (
        prev: { index: number; distanceToPosition: number | null },
        currPosition,
        index
      ) => {
        const distanceToPositionToCheck = new DistanceCalculator()
          .calcDifference3D(currPosition, positionToCheck)
          .calculate();

        if (
          prev.distanceToPosition === null ||
          distanceToPositionToCheck < prev.distanceToPosition
        )
          return {
            index,
            distanceToPosition: distanceToPositionToCheck,
          };

        return prev;
      },
      {
        index: -1,
        distanceToPosition: null,
      }
    );
  }

  getNearestPlayerToPosition(players: PlayerObject[], position: Position) {
    const playerPositionsMapped = players
      .map((player) => {
        const { position } = getPlayerDiscProperties(player.id)!;
        if (!position) return null;
        return position;
      })
      .filter((el) => el !== null) as Position[];

    if (playerPositionsMapped.length === 0) return null;

    const { index, distanceToPosition } =
      this.getClosestPositionToOtherPosition(playerPositionsMapped, position);

    return { player: players[index], distanceToPosition };
  }

  getIntendedTargetStr(
    players: PlayerObject[],
    position: Position,
    quarterbackId: number
  ) {
    const INTENDED_TARGET_TOLERANCE = MAP_POINTS.YARD * 3;

    players = players.filter((player) => player.id !== quarterbackId);

    const positionData = this.getNearestPlayerToPosition(players, position);

    if (positionData === null || positionData.distanceToPosition === null)
      return "";

    const { player, distanceToPosition } = positionData;

    if (player) if (distanceToPosition > INTENDED_TARGET_TOLERANCE) return "";

    return `intended for ${player.name.trim()} `;
  }

  getMapHalfFromPoint(x: Position["x"]) {
    if (x > MAP_POINTS.KICKOFF) return TEAMS.BLUE;
    if (x < MAP_POINTS.KICKOFF) return TEAMS.RED;
    return 0;
  }
}

export default new MapReferee();
