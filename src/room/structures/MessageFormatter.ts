import { Position } from "../HBClient";
import { toClock } from "../utils/haxUtils";
import { plural } from "../utils/utils";
import DownAndDistanceFormatter from "./DownAndDistanceFormatter";

export default class MessageFormatter {
  static formatYardMessage(yard: number, x: Position["x"]) {
    const halfStr = DownAndDistanceFormatter.formatPositionToMapHalf(x);
    return yard <= 0 ? `in the endzone` : `at the ${halfStr}${yard}`;
  }

  static formatNetYardsMessage(netYards: number) {
    const yardMessage = plural(netYards, "yard", "yards");
    if (netYards > 0) return `+${yardMessage}`;
    if (netYards < 0) return `-${yardMessage}`;
    return `no gain`;
  }

  static formatMessageMaybeWithClock(message: string, time: number) {
    const WARNING_TIME = 720;
    return `${message} ${time >= WARNING_TIME ? toClock(time) : ""}`;
  }
}
