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
   * Returns an object checking if there is a safety or touchback based on the two positions
   * @param catchPosition The already adjusted catch position
   * @param rawPlayerPosition The raw player position, we will adjust to teamendzone
   */
  checkIfSafetyOrTouchbackPlayer = (
    catchPosition: Position | null,
    rawPlayerPosition: Position,
    teamId: PlayableTeamId
  ): {
    isSafety: boolean;
    isTouchback: boolean;
  } => {
    console.log("RAW PLAYER POS");
    console.log({ rawPlayerPosition });
    // Adjust the player position forward
    const adjustedPlayerPosition = PreSetCalculators.adjustPlayerPositionFront(
      rawPlayerPosition,
      teamId
    );

    // Now lets round to the endzones
    const roundedPlayerX =
      PreSetCalculators.roundAdjustedEndDistanceAroundEndzone(
        adjustedPlayerPosition.x,
        teamId
      );

    console.log({ adjustedPlayerPosition }, { roundedPlayerX });

    const playEndedInEndzone = MapReferee.getEndZonePositionIsIn({
      x: roundedPlayerX.distance,
      y: adjustedPlayerPosition.y,
    });

    // Now check that hes in the endzone, and that hes in his own endzone
    const playEndedInOwnEndzone =
      playEndedInEndzone && playEndedInEndzone === teamId;

    console.log(playEndedInOwnEndzone);

    // If the play didnt end in the endzone, neither are true
    if (!playEndedInOwnEndzone)
      return {
        isSafety: false,
        isTouchback: false,
      };

    // Now we know its either a touchback or a safety, just distinguish
    // Safety - catchPosition was OUTSIDE of endzone
    // Touchback - catchPosition was INSIDE endzone

    const catchPositionInsideEndzone =
      catchPosition === null
        ? false
        : Boolean(MapReferee.getEndZonePositionIsIn(catchPosition));

    console.log(catchPosition);
    console.log(catchPositionInsideEndzone);

    // If we caught the ball in the endzone, its a touchback
    if (catchPositionInsideEndzone)
      return {
        isSafety: false,
        isTouchback: true,
      };

    // If not, ball was possessed outside of endzone and thus a safety
    return {
      isSafety: true,
      isTouchback: false,
    };
  };

  checkIfTouchbackBall(ballPosition: Position, teamId: PlayableTeamId) {
    // We know the ball went out of bounds, so we really only care if it was infront in the endzone or not
    const endZone = MapReferee.getEndZonePositionIsIn(ballPosition);

    // Check if it went out in our endzone
    return endZone === teamId;
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
