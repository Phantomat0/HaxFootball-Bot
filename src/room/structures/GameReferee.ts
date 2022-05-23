import { TEAMS } from "..";
import { PlayableTeamId, Position } from "../HBClient";
import { MAP_POINTS } from "../utils/map";
import MapReferee from "./MapReferee";
import PreSetCalculators from "./PreSetCalculators";

class GameReferee {
  /**
   * Check if there is a safety when the ball goes out of bounds
   */
  checkIfSafetyBall(ballPosition: Position, team: PlayableTeamId) {
    return MapReferee.getEndZonePositionIsIn(ballPosition) === team;
  }

  /**
   * Check if a tackle can be considered a tackle
   */
  checkIfSack(
    qbPosition: Position,
    losX: number,
    offenseTeamId: PlayableTeamId
  ) {
    return MapReferee.checkIfBehind(qbPosition.x, losX, offenseTeamId);
  }

  /**
   * Check if the player was tackled in their own endzone, adjusting the playerPosition
   * @param rawPlayerPosition The raw player position, we will adjust to teamendzone
   */
  checkIfSafetyPlayer = (
    rawPlayerPosition: Position,
    teamId: PlayableTeamId
  ) => {
    // Adjust the player position forward, but also for safeties we have to round to player nad ma
    const adjustedPlayerPosition =
      PreSetCalculators.adjustPlayerPositionFrontAfterPlay(
        rawPlayerPosition,
        teamId
      );

    const endZone = MapReferee.getEndZonePositionIsIn(adjustedPlayerPosition);

    // Now check that hes in the endzone, and that hes in his own endzone
    return endZone && endZone === teamId;
  };

  checkIfTouchbackBall(ballPosition: Position, teamId: PlayableTeamId) {
    // We know the ball went out of bounds, so we really only care if it was infront in the endzone or not
    const endZone = MapReferee.getEndZonePositionIsIn(ballPosition);

    // Check if it went out in our endzone
    return endZone === teamId;
  }

  /**
   * Touchback occurs if the ball was never possessed outside of the endzone
   */
  checkIfTouchbackPlayer(
    endPosition: Position,
    catchPosition: Position,
    teamId: PlayableTeamId
  ) {
    // If theres no catch position, just check endPosition
    // if (catchPosition === null)
    //   return Boolean(MapReferee.getEndZonePositionIsIn(endPosition));

    return (
      MapReferee.getEndZonePositionIsIn(endPosition) === teamId &&
      Boolean(MapReferee.getEndZonePositionIsIn(catchPosition))
    );
  }

  checkIfTouchdown(rawPlayerPosition: Position, teamId: PlayableTeamId) {
    // Adjust the player position forward
    const adjustedPlayerPosition = PreSetCalculators.adjustPlayerPositionFront(
      rawPlayerPosition,
      teamId
    );

    const endZone = MapReferee.getEndZonePositionIsIn(adjustedPlayerPosition);

    // Now check that hes in the endzone, and that hes not in his own endzone
    return endZone && endZone !== teamId;
  }

  checkIfFieldGoalSuccessful(
    ballPosition: Position,
    offenseTeamId: PlayableTeamId
  ) {
    const { x } = ballPosition;
    const { redFG, blueFG } = PreSetCalculators.adjustMapCoordinatesForRadius(
      MAP_POINTS.BALL_RADIUS
    );
    return offenseTeamId === TEAMS.RED ? x > blueFG : x < redFG;
  }

  checkIfInterceptionWithinTime(intTime: number, timeNow: number) {
    const INTERCEPTION_TIME_LIMIT = 5;

    const differenceBetweenIntTimeAndTimeNow = intTime - timeNow;

    return differenceBetweenIntTimeAndTimeNow < INTERCEPTION_TIME_LIMIT;
  }

  // Check for the ball position to be behind one of the endzones and between FG posts
  checkIfInterceptionSuccessful(ballPosition: Position) {
    const isBehindRedFG = MapReferee.checkIfBallBetweenFGPosts(
      ballPosition,
      TEAMS.RED as PlayableTeamId
    );
    const isBehindBlueFG = MapReferee.checkIfBallBetweenFGPosts(
      ballPosition,
      TEAMS.BLUE as PlayableTeamId
    );

    return isBehindRedFG || isBehindBlueFG;
  }
}

export default new GameReferee();
