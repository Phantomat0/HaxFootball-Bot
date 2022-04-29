import { Position } from "../HBClient";
import { MAP_POINTS } from "../utils/map";
import { plural } from "../utils/utils";

class MessageFormats {
  getHalfStr = (x: Position["x"]) => {
    if (x > MAP_POINTS.KICKOFF) return "BLUE ";
    if (x < MAP_POINTS.KICKOFF) return "RED ";
    return "";
  };

  getYardMessage(yard: number, x: Position["x"]) {
    const halfStr = this.getHalfStr(x);
    return yard <= 0 ? `in the endzone` : `at the ${halfStr}${yard}`;
  }

  getNetYardsMessage(netYards: number) {
    const yardMessage = plural(netYards, "yard", "yards");
    if (netYards > 0) return `+${yardMessage}`;
    if (netYards < 0) return `-${yardMessage}`;
    return `no gain`;
  }
}

export default new MessageFormats();
