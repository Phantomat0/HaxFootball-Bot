import { Position } from "../HBClient";
import { MAP_POINTS } from "./map";
import { isInRectangleArea } from "./utils";

interface MapSection {
  name: "Top Corner" | "Bottom Corner" | "Middle" | "Deep";
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
      name: "Top Corner",
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
      name: "Bottom Corner",
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
      name: "Middle",
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
      name: "Deep",
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

  getSectionName(position: Position, losX: number) {
    const sectionObj = this._mapSectionsList.find((section) => {
      const rectangleArea = section.getRectangleArea(losX);
      return isInRectangleArea(rectangleArea, position);
    });

    return sectionObj?.name ?? null;
  }
}
