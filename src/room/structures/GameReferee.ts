import { PlayableTeamId, Position } from "../HBClient";
import { MAP_POINTS } from "../utils/map";
import { TEAMS } from "../utils/types";
import MapReferee from "./MapReferee";
import PreSetCalculators from "./PreSetCalculators";

export default class GameReferee {
  /**
   * Check if there is a safety when the ball goes out of bounds
   */
  static checkIfSafetyBall(ballPosition: Position, team: PlayableTeamId) {
    return MapReferee.getEndZonePositionIsIn(ballPosition) === team;
  }

  /**
   * Check if a tackle can be considered a tackle
   */
  static checkIfSack(
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
  static checkIfSafetyOrTouchbackPlayer = (
    startPosition: Position,
    endPosition: Position,
    teamId: PlayableTeamId
  ): {
    isSafety: boolean;
    isTouchback: boolean;
  } => {
    const playEndedInEndzone = MapReferee.getEndZonePositionIsIn({
      x: endPosition.x,
      y: endPosition.y,
    });

    // Now check that hes in the endzone, and that hes in his own endzone
    const playEndedInOwnEndzone =
      playEndedInEndzone && playEndedInEndzone === teamId;

    // If the play didnt end in the endzone, neither are true
    if (!playEndedInOwnEndzone)
      return {
        isSafety: false,
        isTouchback: false,
      };

    // Now we know its either a touchback or a safety, just distinguish
    // Safety - startPosition was OUTSIDE of endzone
    // Touchback - startPosition was INSIDE endzone

    // Start position can be the LOS, where the pass was caught, where the int was kicked, but its already been adjusted

    const startPositionInsideEndzone = Boolean(
      MapReferee.getEndZonePositionIsIn(startPosition)
    );

    // If we caught the ball in the endzone, its a touchback
    if (startPositionInsideEndzone)
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

  static checkIfTouchbackBall(
    adjustedBallPosition: Position,
    teamId: PlayableTeamId
  ) {
    // We know the ball went out of bounds, so we really only care if it was infront in the endzone or not
    const endZone = MapReferee.getEndZonePositionIsIn(adjustedBallPosition);

    // Check if it went out in our endzone
    return endZone === teamId;
  }

  static checkIfTouchdown(rawPlayerPosition: Position, teamId: PlayableTeamId) {
    // Adjust the player position forward
    const adjustedPlayerPosition = PreSetCalculators.adjustPlayerPositionFront(
      rawPlayerPosition,
      teamId
    );

    const endZone = MapReferee.getEndZonePositionIsIn(adjustedPlayerPosition);

    // Now check that hes in the endzone, and that hes not in his own endzone
    return Boolean(endZone) && endZone !== teamId;
  }

  static checkIfFieldGoalSuccessful(
    ballPosition: Position,
    offenseTeamId: PlayableTeamId
  ) {
    const { topFG, botFG, redFG, blueFG } =
      PreSetCalculators.adjustMapCoordinatesForRadius(MAP_POINTS.BALL_RADIUS);

    // First check alongside the x, if it passed the FG line
    // For opposing endzone, we wanna check if its infront, for our own if its behind
    const satisfiesXAxis =
      offenseTeamId === 1
        ? MapReferee.checkIfBehind(ballPosition.x, blueFG, 2)
        : MapReferee.checkIfBehind(ballPosition.x, redFG, 1);

    const satisfiesYAxis = MapReferee.checkIfBetweenY(
      ballPosition.y,
      topFG,
      botFG
    );

    const ballCompletelyOutOfBounds =
      MapReferee.checkIfBallCompletelyOutOfBounds(ballPosition);

    return satisfiesXAxis && satisfiesYAxis && ballCompletelyOutOfBounds;
  }

  static checkIfInterceptionWithinTime(intTime: number, timeNow: number) {
    const INTERCEPTION_TIME_LIMIT = 5;

    const differenceBetweenIntTimeAndTimeNow = intTime - timeNow;

    return differenceBetweenIntTimeAndTimeNow < INTERCEPTION_TIME_LIMIT;
  }

  // Check for the ball position to be behind one of the endzones and between FG posts
  static checkIfInterceptionSuccessful(ballPosition: Position) {
    const isBetweenFieldGoalPosts =
      MapReferee.checkIfBallBetweenFGPosts(ballPosition);

    const ballCompletelyOutOfBounds =
      MapReferee.checkIfBallCompletelyOutOfBounds(ballPosition);

    return isBetweenFieldGoalPosts && ballCompletelyOutOfBounds;
  }

  static isIntentionalGrounding({
    playerPosition,
    losX,
    defenseTeamId,
  }: {
    playerPosition: Position;
    defenseTeamId: PlayableTeamId;
    losX: number;
  }) {
    const ballWithinHashes = MapReferee.checkIfWithinHash(
      playerPosition,
      MAP_POINTS.PLAYER_RADIUS
    );

    const defenderInFrontOfLOS = MapReferee.checkIfInFront(
      playerPosition.x,
      losX,
      defenseTeamId
    );

    return ballWithinHashes && defenderInFrontOfLOS;
  }
}
