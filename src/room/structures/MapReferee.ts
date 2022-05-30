import { TEAMS } from "..";
import { PlayableTeamId, PlayerObject, Position } from "../HBClient";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import { MAP_POINTS } from "../utils/map";
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
      const isOnside = this.checkIfBehind(x, pointToBeBehind, team);
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

  checkIfBallBetweenFGPosts(position: Position, endzoneTeamId: PlayableTeamId) {
    const { topFG, botFG, redFG, blueFG } =
      PreSetCalculators.adjustMapCoordinatesForRadius(MAP_POINTS.BALL_RADIUS);

    // First check alongside the x, if it passed the FG line
    // For opposing endzone, we wanna check if its infront, for our own if its behind
    const satisfiesXAxis =
      endzoneTeamId === 1
        ? this.checkIfBehind(position.x, redFG, 1)
        : this.checkIfBehind(position.x, blueFG, 2);

    const satisfiesYAxis = this.checkIfBetweenY(position.y, topFG, botFG);

    return satisfiesXAxis && satisfiesYAxis;
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

  getNearestPlayerToPosition(players: PlayerObject[], position: Position) {
    return players.reduce(
      (prev: { player: PlayerObject | null; distanceToBall: number }, curr) => {
        const { position: playerPosition } = getPlayerDiscProperties(curr.id)!;
        const distanceToBall = new DistanceCalculator()
          .calcDifference3D(position, playerPosition)
          .calculate();

        if (distanceToBall > prev.distanceToBall)
          return {
            player: curr,
            distanceToBall: distanceToBall,
          };

        return prev;
      },
      {
        player: null,
        distanceToBall: 0,
      }
    ).player;
  }
}

export default new MapReferee();
