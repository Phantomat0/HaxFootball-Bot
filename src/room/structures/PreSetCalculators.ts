import { PlayableTeamId, Position } from "../HBClient";
import { MAP_POINTS } from "../utils/map";
import { TEAMS } from "../utils/types";
import DistanceCalculator, { DistanceConverter } from "./DistanceCalculator";

export default class PreSetCalculators {
  static adjustPlayerPositionFront(position: Position, teamId: PlayableTeamId) {
    const xPositionFront = new DistanceCalculator()
      .addByTeam(position.x, MAP_POINTS.PLAYER_RADIUS, teamId)
      .calculate();
    return {
      x: xPositionFront,
      y: position.y,
    };
  }

  static adjustBallPositionOnOutOfBounds(
    rawEndPosition: Position,
    teamId: PlayableTeamId
  ) {
    // We do the same thing as player position, but using BALL_RADIUS
    const xPositionFront = new DistanceCalculator()
      .addByTeam(rawEndPosition.x, MAP_POINTS.BALL_RADIUS, teamId)
      .roundUpToYardIfBetweenTeamEndzoneAndOneYard(teamId)
      .roundToYardByTeam(teamId)
      .constrainToEndzonePoints()
      .calculate();
    return {
      x: xPositionFront,
      y: rawEndPosition.y,
    };
  }

  static getNetYardsAndAdjustedEndPosition(
    alreadyAdjustedStartingPosition: Position,
    rawEndPosition: Position,
    offenseTeamId: PlayableTeamId
  ) {
    const adjustedEndPosition = this.adjustRawEndPosition(
      rawEndPosition,
      offenseTeamId
    );
    const { distance: adjustedEndPositionX, yardLine } = new DistanceCalculator(
      adjustedEndPosition.x
    ).calculateAndConvert();

    const { yards: netYards } = new DistanceCalculator()
      .calcNetDifferenceByTeam(
        alreadyAdjustedStartingPosition.x,
        adjustedEndPositionX,
        offenseTeamId
      )
      .calculateAndConvert();

    return {
      netYards,
      yardLine,
      adjustedEndPositionX,
    };
  }

  static adjustRawEndPosition(
    rawEndPosition: Position,
    teamId: PlayableTeamId
  ): Position {
    // We need to do the following to the EndPosition:
    // 1. Add the MAP_BALL_RADIUS to the player, in the correct direction
    // 2. Make sure if the ball is between the 0 and 1 yardline of the offense, it gets rounded up.
    // 3. Round to the nearest yard, always rounding down
    // 4. Constrain to the nearest endzone
    const xPositionFront = new DistanceCalculator()
      .addByTeam(rawEndPosition.x, MAP_POINTS.PLAYER_RADIUS, teamId)
      .roundUpToYardIfBetweenTeamEndzoneAndOneYard(teamId)
      .roundToYardByTeam(teamId)
      .constrainToEndzonePoints()
      .calculate();
    return {
      x: xPositionFront,
      y: rawEndPosition.y,
    };
  }

  static getPositionOfTeamYard(yard: number, team: PlayableTeamId) {
    const MIDFIELD_YARD = 50;

    const yardToDistance = DistanceConverter.yardToDistance(
      MIDFIELD_YARD - yard
    );

    return team === TEAMS.BLUE ? yardToDistance : -yardToDistance;
  }

  static adjustMapCoordinatesForRadius = (objectRadius: number) => {
    const {
      TOP_SIDELINE,
      BOT_SIDELINE,
      RED_SIDELINE,
      BLUE_SIDELINE,
      TOP_HASH,
      BOT_HASH,
      RED_FIELD_GOAL_LINE,
      BLUE_FIELD_GOAL_LINE,
      TOP_FG_POST,
      BOTTOM_FG_POST,
    } = MAP_POINTS;

    return {
      topSideLine: TOP_SIDELINE + objectRadius,
      botSideLine: BOT_SIDELINE - objectRadius,
      redSideLine: RED_SIDELINE + objectRadius,
      blueSideLine: BLUE_SIDELINE - objectRadius,
      topHash: TOP_HASH + objectRadius,
      botHash: BOT_HASH - objectRadius,
      redFG: RED_FIELD_GOAL_LINE + objectRadius,
      blueFG: BLUE_FIELD_GOAL_LINE - objectRadius,
      topFG: TOP_FG_POST + objectRadius,
      botFG: BOTTOM_FG_POST - objectRadius,
    };
  };
}
