import { TEAMS } from "..";
import { PlayableTeamId, PlayerObject, Position } from "../HBClient";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import { MAP_POINTS } from "../utils/map";
import Ball from "./Ball";
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
      const { position } = getPlayerDiscProperties(player.id);
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
    losX: Position["x"]
  ) {
    const offsidePlayer = players.find((player) => {
      const {
        position: { x },
      } = getPlayerDiscProperties(player.id);
      const isOnside = this.checkIfBehind(x, losX, team);
      return !isOnside;
    });

    return offsidePlayer;
  }

  getEndZonePositionIsIn = (position: Position) => {
    const { RED_ENDZONE, BLUE_ENDZONE } = MAP_POINTS;

    if (position.x <= RED_ENDZONE) return 1;
    if (position.x >= BLUE_ENDZONE) return 2;
    return null;
  };

  // getEndZonePlayerIsIn(rawPlayerPosition: Position, teamId: PlayableTeamId) {
  //   const adjustedPlayerPosition = PreSetCalculators.adjustPlayerPositionFront(
  //     rawPlayerPosition,
  //     teamId
  //   );
  //   return this._getEndZonePositionIsIn(adjustedPlayerPosition.x);
  // }

  // getEndZoneBallIsInForSafety(rawBallPosition: Position, teamId) {
  //   const adjustedBallPosition = PreSetCalculators.adjustBallPosition()
  // }

  checkIfPlayerOutOfBounds(position: Position) {
    // We have to adjust the player position
    const isOutOfBounds = this._checkIfOutOfBounds(
      position,
      MAP_POINTS.PLAYER_RADIUS
    );
    return isOutOfBounds ? position : null;
  }

  checkIfBallOutOfBounds = () => {
    const ballPosition = Ball.getPosition();
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

  // // Also returns the endzone the player is in
  // checkIfPlayerInEndZone = (
  //   playerPosition: Position,
  //   teamId: PlayableTeamId
  // ) => {
  //   const playerPositionX = PreSetCalculators.adjustPlayerPositionFront(
  //     playerPosition,
  //     teamId
  //   );
  //   return this._checkIfInEndzone(x);
  // };

  /**
   * Returns the endzone the x position is in, or null if not in redzone
   */
  checkIfInRedzone(x: Position["x"]) {
    if (x >= MAP_POINTS.BLUE_REDZONE) return TEAMS.BLUE;
    if (x <= MAP_POINTS.RED_REDZONE) return TEAMS.RED;
    return null;
  }

  checkIfBehind(x1: Position["x"], x2: Position["x"], team: PlayableTeamId) {
    return team === TEAMS.RED ? x1 < x2 : x1 > x2;
  }

  checkIfInFront(x1: Position["x"], x2: Position["x"], team: PlayableTeamId) {
    return team === TEAMS.RED ? x1 > x2 : x1 < x2;
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

    console.log(endzoneTeamId);
    console.log(position.y, topFG, botFG);
    console.log(satisfiesXAxis, satisfiesYAxis);
    console.log(position.x, blueFG);

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

  checkIfBallIsMoving() {
    const BALL_DEAD_SPEED = 0.05;
    const { xspeed } = Ball.getSpeed();

    // xpseed can be negative, so make sure you get absoltue value
    return Math.abs(xspeed) > BALL_DEAD_SPEED;
  }

  getTeamEndzone(teamId: PlayableTeamId) {
    return teamId === TEAMS.RED
      ? MAP_POINTS.RED_ENDZONE
      : MAP_POINTS.BLUE_ENDZONE;
  }

  getOpposingTeamEndzone = (teamId: PlayableTeamId) => {
    return teamId === TEAMS.RED
      ? MAP_POINTS.BLUE_ENDZONE
      : MAP_POINTS.RED_ENDZONE;
  };

  getClosestPlayerToBall = () => {
    //   const ballPosition = Ball.getPosition();
    //   const fieldedPlayers = Room.game.players.getFielded();
    //   const distancesOfEachPlayerFromBall = fieldedPlayers.map((player) => {
    //     const { position } = getPlayerDiscProperties(player.id);
    //     const distanceToBall = new DistanceCalculator([position, ballPosition])
    //       .calcDifference()
    //       .getDistance();
    //     return {
    //       player: player,
    //       distanceToBall: distanceToBall,
    //     };
    //   });
    //   console.log(distancesOfEachPlayerFromBall);
    //   const sortedLowestToHighest = distancesOfEachPlayerFromBall.sort((a, b) => {
    //     return a.distanceToBall - b.distanceToBall;
    //   });
    //   console.log(sortedLowestToHighest);
    //   const [obj] = sortedLowestToHighest;
    //   const { player } = obj;
    //   return player;
  };
}

export default new MapReferee();
