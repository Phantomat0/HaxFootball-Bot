import { Position } from "../HBClient";
import { MAP_POINTS } from "../utils/map";

class DownAndDistanceFormatter {
  formatRedZonePenalties(currentRedZonePenalties: 0 | 1 | 2 | 3) {
    if (currentRedZonePenalties === 0) return ""; // If there are no redzone penalties
    return ` [${currentRedZonePenalties}/3]`;
  }

  formatDown(currentDown: 1 | 2 | 3 | 4 | 5) {
    const downStrings = {
      1: "1st",
      2: "2nd",
      3: "3rd",
      4: "4th",
      5: "5th",
    };
    return downStrings[currentDown];
  }

  formatYardsToGain(lineToGainPoint: Position["x"], lineToGainYards: number) {
    console.log(lineToGainPoint);
    if (
      lineToGainPoint <= MAP_POINTS.RED_GOAL_LINE ||
      lineToGainPoint >= MAP_POINTS.BLUE_GOAL_LINE
    )
      return "GOAL";
    return lineToGainYards;
  }

  formatPositionToMapHalf = (x: Position["x"]) => {
    if (x > MAP_POINTS.KICKOFF) return "BLUE ";
    if (x < MAP_POINTS.KICKOFF) return "RED ";
    return "";
  };
}

export default new DownAndDistanceFormatter();
