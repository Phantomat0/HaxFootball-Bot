import { PlayableTeamId, Position } from "../HBClient";
import DistanceCalculator from "./DistanceCalculator";

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

  static adjustBallPosition(
    ballPositionX: Position["x"],
    teamId: PlayableTeamId
  ) {
    return new DistanceCalculator(ballPositionX)
      .roundToTeamEndzone(teamId)
      .roundToYardByTeam(teamId)
      .calculate();
  }
}
