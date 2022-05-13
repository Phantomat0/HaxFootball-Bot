import { Position } from "../HBClient";
import { MAP_POINTS } from "./map";
import { isInRectangleArea } from "./utils";

export type MapSectionName =
  | "cornerTop"
  | "cornerBottom"
  | "middle"
  | "deep"
  | "behind";

export interface MapSection {
  name: MapSectionName;
  getRectangleArea: (losX: number) => {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export default class MapSectionFinder {
  private _mapSectionsList: MapSection[] = [
    {
      name: "cornerTop",
      getRectangleArea: function (losX: number) {
        const { YARD, TOP_SIDELINE, ABOVE_HASH } = MAP_POINTS;

        const fifteenYardsInFrontOfLOS = losX + YARD * 15;
        const fifteenYardsBehindLOS = losX - YARD * 15;

        return {
          x1: fifteenYardsBehindLOS,
          y1: TOP_SIDELINE,
          x2: fifteenYardsInFrontOfLOS,
          y2: ABOVE_HASH,
        };
      },
    },
    {
      name: "cornerBottom",
      getRectangleArea: function (losX: number) {
        const { YARD, BOT_SIDELINE, BELOW_HASH } = MAP_POINTS;

        const fifteenYardsInFrontOfLOS = losX + YARD * 15;
        const fifteenYardsBehindLOS = losX - YARD * 15;

        return {
          x1: fifteenYardsBehindLOS,
          y1: BELOW_HASH,
          x2: fifteenYardsInFrontOfLOS,
          y2: BOT_SIDELINE,
        };
      },
    },
    {
      name: "middle",
      getRectangleArea: function (losX: number) {
        const { YARD, ABOVE_HASH, BELOW_HASH } = MAP_POINTS;

        const fifteenYardsInFrontOfLOS = losX + YARD * 15;
        const fifteenYardsBehindLOS = losX - YARD * 15;

        return {
          x1: fifteenYardsBehindLOS,
          y1: ABOVE_HASH,
          x2: fifteenYardsInFrontOfLOS,
          y2: BELOW_HASH,
        };
      },
    },
    {
      name: "deep",
      getRectangleArea: function (losX: number) {
        const { YARD, BOT_SIDELINE, TOP_SIDELINE, BLUE_SIDELINE } = MAP_POINTS;

        const fifteenYardsInFrontOfLOS = losX + YARD * 15;

        return {
          x1: fifteenYardsInFrontOfLOS,
          y1: TOP_SIDELINE,
          x2: BLUE_SIDELINE,
          y2: BOT_SIDELINE,
        };
      },
    },
  ];

  getSectionName(positionToCheck: Position, losX: number): MapSectionName {
    const sectionObj = this._mapSectionsList.find((section) => {
      const rectangleArea = section.getRectangleArea(losX);
      return isInRectangleArea(rectangleArea, positionToCheck);
    });

    return sectionObj?.name as unknown as MapSectionName;
  }
}
