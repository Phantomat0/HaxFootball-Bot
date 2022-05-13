import { Position } from "../HBClient";
import { plural } from "../utils/utils";
import DownAndDistanceFormatter from "./DownAndDistanceFormatter";

class MessageFormatter {
  formatYardMessage(yard: number, x: Position["x"]) {
    const halfStr = DownAndDistanceFormatter.formatPositionToMapHalf(x);
    return yard <= 0 ? `in the endzone` : `at the ${halfStr}${yard}`;
  }

  formatNetYardsMessage(netYards: number) {
    const yardMessage = plural(netYards, "yard", "yards");
    if (netYards > 0) return `+${yardMessage}`;
    if (netYards < 0) return `-${yardMessage}`;
    return `no gain`;
  }
}

export default new MessageFormatter();
