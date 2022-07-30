import { Position } from "../HBClient";
import { toClock } from "../utils/haxUtils";
import { MapSectionName } from "../utils/MapSectionFinder";
import { plural } from "../utils/utils";
import DownAndDistanceFormatter from "./DownAndDistanceFormatter";

export default class MessageFormatter {
  static formatYardAndHalfStr(yard: number, x: Position["x"]) {
    const halfStr = DownAndDistanceFormatter.formatPositionToMapHalf(x);
    return yard <= 0 ? `in the endzone` : `at the ${halfStr}${yard}`;
  }

  static formatNetYardsMessage(netYards: number) {
    const yardMessage = plural(netYards, "yard", "yards");
    if (netYards > 0) return `+${yardMessage}`;
    if (netYards < 0) return `-${yardMessage}`;
    return `no gain`;
  }

  static formatNetYardsMessageFull(netYards: number) {
    const yardMessage = plural(Math.abs(netYards), "yard", "yards");
    if (netYards > 0) return `for a gain of ${yardMessage}`;
    if (netYards < 0) return `for a loss of ${yardMessage}`;
    return "for no gain";
  }

  static formatMessageMaybeWithClock(message: string, time: number) {
    const WARNING_TIME = 720;
    return `${message} ${time >= WARNING_TIME ? toClock(time) : ""}`;
  }

  static formatMapSectionName(mapSection: MapSectionName) {
    const newNameMap: Record<MapSectionName, string> = {
      cornerBottom: "bottom corner",
      cornerTop: "top corner",
      deep: "deep",
      middle: "middle",
      backwards: "backwards",
    };

    return newNameMap[mapSection];
  }
}
