import Room, { TEAMS } from "..";
import { PlayableTeamId, PlayerObject, Position } from "../HBClient";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import { MAP_POINTS } from "../utils/map";
import Ball from "./Ball";

/**
 * Handles all HFL Map Logic and Calculations
 */
class MapReferee {
  private _adjustMapCoordinatesForRadius = (objectRadius: number) => {
    const {
      TOP_SIDELINE,
      BOT_SIDELINE,
      RED_SIDELINE,
      BLUE_SIDELINE,
      TOP_HASH,
      BOT_HASH,
      RED_FIELD_GOAL_LINE,
      BLUE_FIELD_GOAL_LINE,
    } = MAP_POINTS;

    return {
      topSideLine: TOP_SIDELINE + objectRadius,
      botSideLine: BOT_SIDELINE - objectRadius,
      redSideLine: RED_SIDELINE + objectRadius,
      blueSideLine: BLUE_SIDELINE - objectRadius,
      topHash: TOP_HASH + objectRadius,
      botHash: BOT_HASH - objectRadius,
      redFG: RED_FIELD_GOAL_LINE - objectRadius,
      blueFG: BLUE_FIELD_GOAL_LINE + objectRadius,
    };
  };

  checkIfOutOfBounds(objectToCheck: Position, objectRadius: number) {
    const { x, y } = objectToCheck;
    // Adjust for Ball Radius
    const { topSideLine, botSideLine, redSideLine, blueSideLine } =
      this._adjustMapCoordinatesForRadius(objectRadius);
    return (
      y < topSideLine || y > botSideLine || x < redSideLine || x > blueSideLine
    );
  }

  checkIfPlayerOutOfBounds(player: PlayerObject) {
    // We have to adjust the player position
    const { position } = getPlayerDiscProperties(player.id);
    const isOutOfBounds = this.checkIfOutOfBounds(
      position,
      MAP_POINTS.PLAYER_RADIUS
    );
    return isOutOfBounds ? position : null;
  }

  checkIfTouchdown(player: PlayerObject) {
    const endZone = this.checkIfPlayerInEndZone(player);
    return endZone && endZone !== player.team;
  }

  // Also returns the endzone the player is in
  checkIfPlayerInEndZone = (player: PlayerObject) => {
    const { x } = DistanceCalculator.adjustPosition(player);
    return this.checkIfInEndzone(x);
  };

  checkIfInEndzone = (x: Position["x"]) => {
    const { RED_ENDZONE, BLUE_ENDZONE } = MAP_POINTS;

    if (x <= RED_ENDZONE) return 1;
    if (x >= BLUE_ENDZONE) return 2;
    return null;
  };

  checkIfBallOutOfBounds = () => {
    const ballPosition = Ball.getPosition();
    const isOutOfBounds = this.checkIfOutOfBounds(
      ballPosition,
      MAP_POINTS.BALL_RADIUS
    );
    return isOutOfBounds ? ballPosition : null;
  };

  checkIfSafetyPlayer = (position: Position, team: PlayableTeamId) => {
    const adjustedPos = new DistanceCalculator([
      position.x,
      MAP_POINTS.PLAYER_RADIUS,
    ])
      .addByTeam(team)
      .getDistance();

    const inEndzone = this.checkIfInEndzone(adjustedPos);
    return inEndzone;
  };

  checkIfSafetyBall = (ballPositionX: Position["x"], team: PlayableTeamId) => {
    return this.checkIfInEndzone(ballPositionX) === team;
  };

  checkIfInRedzone(x: Position["x"]) {
    return x >= MAP_POINTS.BLUE_REDZONE || x <= MAP_POINTS.RED_REDZONE;
  }

  checkIfBehind(x1: Position["x"], x2: Position["x"], team: PlayableTeamId) {
    return team === TEAMS.RED ? x1 < x2 : x1 > x2;
  }

  checkIfInFront(x1: Position["x"], x2: Position["x"], team: PlayableTeamId) {
    return team === TEAMS.RED ? x1 > x2 : x1 < x2;
  }

  checkIfTouchbackBall(ballPositionX: Position["x"], teamId: PlayableTeamId) {
    // We know the ball went out of bounds, so we really only care if it was infront in the endzone or not
    const endZone = this.checkIfInEndzone(ballPositionX);
    return endZone === teamId;
  }

  checkIfTouchback(
    endPositionX: Position["x"],
    catchPositionX: Position["x"],
    team: PlayableTeamId
  ) {
    if (catchPositionX === null) return this.checkIfInEndzone(endPositionX);
    return (
      this.checkIfInEndzone(endPositionX) === team &&
      this.checkIfInEndzone(catchPositionX)
    );
  }

  checkIfWithinHash(position: Position, radius: number) {
    const { y } = position;
    const { topHash, botHash } = this._adjustMapCoordinatesForRadius(radius);

    return y > topHash && y < botHash;
  }

  checkIfFieldGoalSuccessful(offenseTeamId: PlayableTeamId) {
    const { x } = Ball.getPosition();
    const { redFG, blueFG } = this._adjustMapCoordinatesForRadius(
      MAP_POINTS.BALL_RADIUS
    );
    return offenseTeamId === TEAMS.RED ? x > blueFG : x < redFG;
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
    const ballPosition = Ball.getPosition();
    const fieldedPlayers = Room.game.players.getFielded();

    const distancesOfEachPlayerFromBall = fieldedPlayers.map((player) => {
      const { position } = getPlayerDiscProperties(player.id);

      const distanceToBall = new DistanceCalculator([position, ballPosition])
        .calcDifference()
        .getDistance();

      return {
        player: player,
        distanceToBall: distanceToBall,
      };
    });

    console.log(distancesOfEachPlayerFromBall);

    const sortedLowestToHighest = distancesOfEachPlayerFromBall.sort((a, b) => {
      return a.distanceToBall - b.distanceToBall;
    });

    console.log(sortedLowestToHighest);

    const [obj] = sortedLowestToHighest;
    const { player } = obj;

    return player;
  };
}

export default new MapReferee();
