import { PlayableTeamId, Position } from "../HBClient";
import DistanceCalculator from "../structures/DistanceCalculator";
import { MAP_POINTS } from "./map";
import { TEAMS } from "./types";
import { isInRectangleArea } from "./utils";

export type MapSectionName =
  | "cornerTop"
  | "cornerBottom"
  | "middle"
  | "deep"
  | "backwards";

export interface MapSection {
  name: MapSectionName;
  getRectangleArea: (
    fifteenYardsBehindLOS: number,
    fifteenYardsInFrontOfLOS: number,
    losX: number,
    offenseTeamId: PlayableTeamId
  ) => {
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
      getRectangleArea: function (
        fifteenYardsLeftOfLOS,
        fifteenYardsRightOfLOS
      ) {
        const { TOP_SIDELINE, ABOVE_HASH } = MAP_POINTS;

        return {
          x1: fifteenYardsLeftOfLOS,
          y1: TOP_SIDELINE - 1000,
          x2: fifteenYardsRightOfLOS,
          y2: ABOVE_HASH,
        };
      },
    },
    {
      name: "cornerBottom",
      getRectangleArea: function (
        fifteenYardsLeftOfLOS,
        fifteenYardsRightOfLOS
      ) {
        const { BOT_SIDELINE, BELOW_HASH } = MAP_POINTS;

        return {
          x1: fifteenYardsLeftOfLOS,
          y1: BELOW_HASH,
          x2: fifteenYardsRightOfLOS,
          y2: BOT_SIDELINE + 1000,
        };
      },
    },
    {
      name: "middle",
      getRectangleArea: function (
        fifteenYardsLeftOfLOS,
        fifteenYardsRightOfLOS
      ) {
        const { ABOVE_HASH, BELOW_HASH } = MAP_POINTS;
        return {
          x1: fifteenYardsLeftOfLOS,
          y1: ABOVE_HASH,
          x2: fifteenYardsRightOfLOS,
          y2: BELOW_HASH,
        };
      },
    },
    {
      name: "deep",
      getRectangleArea: function (
        fifteenYardsLeftOfLOS,
        fifteenYardsRightOfLOS,
        losX,
        offenseTeamId: PlayableTeamId
      ) {
        const { YARD, BOT_SIDELINE, TOP_SIDELINE } = MAP_POINTS;

        const unlimitedYardsInFrontOfLOS = new DistanceCalculator()
          .addByTeam(losX, YARD * 100, offenseTeamId)
          .calculate();

        /*
    O-----y1------O
    |             |
    x1			     x2
    |			        |
    O----y2------O
    */
        // X1 is the limit for blue, X2 is the limit for red
        return {
          x1:
            offenseTeamId === TEAMS.RED
              ? fifteenYardsLeftOfLOS
              : unlimitedYardsInFrontOfLOS,
          y1: TOP_SIDELINE - 1000,
          x2:
            offenseTeamId === TEAMS.RED
              ? unlimitedYardsInFrontOfLOS
              : fifteenYardsRightOfLOS,
          y2: BOT_SIDELINE + 1000,
        };
      },
    },
  ];

  getSectionName(
    positionToCheck: Position,
    losX: number,
    offenseTeamId: PlayableTeamId
  ): MapSectionName {
    const { YARD } = MAP_POINTS;

    const fifteenYardsLeftOfLOS = losX - YARD * 15;
    const fifteenYardsRightOfLOS = losX + YARD * 15;

    const sectionObj = this._mapSectionsList.find((section) => {
      const rectangleArea = section.getRectangleArea(
        fifteenYardsLeftOfLOS,
        fifteenYardsRightOfLOS,
        losX,
        offenseTeamId
      );
      return isInRectangleArea(rectangleArea, positionToCheck);
    });

    return sectionObj?.name ?? "backwards";
  }
}
