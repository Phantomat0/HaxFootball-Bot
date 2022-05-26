import { TEAMS } from "..";
import { PlayableTeamId, Position } from "../HBClient";
import { MAP_POINTS } from "../utils/map";
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

  static adjustPlayerPositionFrontAfterPlay(
    position: Position,
    teamId: PlayableTeamId
  ) {
    const xPositionFront = new DistanceCalculator()
      .addByTeam(position.x, MAP_POINTS.PLAYER_RADIUS, teamId)
      .roundToYardByTeam(teamId)
      .roundToTeamEndzone(teamId)
      .calculate();
    return {
      x: xPositionFront,
      y: position.y,
    };
  }

  static adjustBallPosition(ballPosition: Position, teamId: PlayableTeamId) {
    const newBallPositionX = new DistanceCalculator(ballPosition.x)
      .roundToTeamEndzone(teamId)
      .roundToYardByTeam(teamId)
      .calculate();

    return {
      x: newBallPositionX,
      y: ballPosition.y,
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

  /**
   *
   * @param adjustedEndDistance Distance already adjusted to player or ball
   */
  static roundAdjustedEndDistanceAroundEndzone(
    adjustedEndDistance: number,
    offenseTeamId: PlayableTeamId
  ) {
    // Adjust it so if its between and 0 and 1 yard line we always round up
    // Round it to either 775 or -775
    const endDistanceConstrainedAndRounded = new DistanceCalculator(
      adjustedEndDistance
    )
      .roundToTeamEndzone(offenseTeamId)
      .constrainToEndzonePoints()
      .calculateAndConvert();

    return endDistanceConstrainedAndRounded;
  }
}
