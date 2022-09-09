import { PlayerRecord } from "../roomStructures/PlayerRecorder";
import ICONS from "../utils/Icons";
import { MapSectionName } from "../utils/MapSectionFinder";
import {
  averageOfArray,
  isObject,
  limitNumberWithinRange,
  round,
  sumObjectValues,
} from "../utils/utils";

type MapSectionStat = Record<MapSectionName, number>;

type MapSectionStatQuery = Record<MapSectionName, 1>;

export class EMPTY_MAP_SECTION_STAT implements MapSectionStat {
  cornerTop = 0;
  cornerBottom = 0;
  middle = 0;
  deep = 0;
  backwards = 0;
  get all() {
    return sumObjectValues(this as unknown as Record<string, number>);
  }
}

type PartialMapSection = Partial<MapSectionStat>;
type PartialMapSectionStatQuery = Partial<MapSectionStatQuery>;

export interface IPlayerStat {
  // Receiving
  receptions: PartialMapSection;
  receivingYards: PartialMapSection;
  receivingYardsAfterCatch: PartialMapSection;
  rushingAttempts: number;
  rushingYards: number;
  touchdownsReceived: number;
  touchdownsRushed: number;

  // Passing
  passAttempts: PartialMapSection;
  passCompletions: PartialMapSection;
  passYards: PartialMapSection;
  passYardsDistance: PartialMapSection;
  touchdownsThrown: number;
  interceptionsThrown: number;
  qbSacks: number;
  distanceMovedBeforePassArr: number[];
  timeToPassArr: number[];
  curvedPassAttempts: number;
  curvedPassCompletions: number;

  // Defense
  passDeflections: PartialMapSection;
  tackles: number;
  yardsAllowed: PartialMapSection;
  sacks: number;
  forcedFumbles: number;
  interceptionsReceived: number;

  // Special Teams
  specReceptions: number;
  specReceivingYards: number;
  specTouchdowns: number;
  specTackles: number;
  fgAttempts: number;
  fgYardsAttempted: number;
  fgMade: number;
  fgYardsMade: number;

  // Misc
  timePlayed: number;
  fumbles: number;
  penalties: number;
  onsideKicksAttempted: number;
  onsideKicksConverted: number;
}

export interface PlayerStatQuery {
  // Receiving
  receptions: PartialMapSectionStatQuery;
  receivingYards: PartialMapSection;
  receivingYardsAfterCatch: PartialMapSectionStatQuery;
  rushingAttempts: 1;
  rushingYards: number;
  touchdownsReceived: 1;
  touchdownsRushed: 1;

  // Passing
  passAttempts: PartialMapSectionStatQuery;
  passCompletions: PartialMapSectionStatQuery;
  passYards: PartialMapSection;
  passYardsDistance: PartialMapSectionStatQuery;
  touchdownsThrown: 1;
  interceptionsThrown: 1;
  qbSacks: 1;
  distanceMovedBeforePassArr: [number];
  timeToPassArr: [number];
  curvedPassAttempts: 1;
  curvedPassCompletions: 1;

  // Defense
  passDeflections: PartialMapSectionStatQuery;
  tackles: 1 | 0.5;
  yardsAllowed: PartialMapSection;
  sacks: 1;
  forcedFumbles: 1;
  interceptionsReceived: 1;

  // Special Teams
  specReceptions: 1;
  specReceivingYards: number;
  specTouchdowns: 1;
  specTackles: 1;
  fgAttempts: 1;
  fgYardsAttempted: number;
  fgMade: 1;
  fgYardsMade: number;

  // Misc
  timePlayed: number;
  fumbles: 1;
  penalties: 1;
  onsideKicksAttempted: 1;
  onsideKicksConverted: 1;
}

export default class PlayerStats implements IPlayerStat {
  recordId: PlayerRecord["recordId"];
  // Receiving
  receptions = new EMPTY_MAP_SECTION_STAT();
  receivingYards = new EMPTY_MAP_SECTION_STAT();
  receivingYardsAfterCatch = new EMPTY_MAP_SECTION_STAT();
  rushingAttempts: number = 0;
  rushingYards: number = 0;
  touchdownsReceived: number = 0;
  touchdownsRushed: number = 0;

  // Passing
  passAttempts = new EMPTY_MAP_SECTION_STAT();
  passCompletions = new EMPTY_MAP_SECTION_STAT();
  passYards = new EMPTY_MAP_SECTION_STAT();
  passYardsDistance = new EMPTY_MAP_SECTION_STAT();
  touchdownsThrown: number = 0;
  interceptionsThrown: number = 0;
  qbSacks: number = 0;
  distanceMovedBeforePassArr: number[] = [];
  timeToPassArr: number[] = [];
  curvedPassAttempts: number = 0;
  curvedPassCompletions: number = 0;

  // Defense
  passDeflections = new EMPTY_MAP_SECTION_STAT();
  tackles: number = 0;
  yardsAllowed = new EMPTY_MAP_SECTION_STAT();
  sacks: number = 0;
  forcedFumbles: number = 0;
  interceptionsReceived: number = 0;

  // Special Teams
  specReceptions: number = 0;
  specReceivingYards: number = 0;
  specTouchdowns: number = 0;
  specTackles: number = 0;
  fgAttempts: number = 0;
  fgYardsAttempted: number = 0;
  fgMade: number = 0;
  fgYardsMade: number = 0;

  // Misc
  timePlayed: number = 0;
  fumbles: number = 0;
  penalties: number = 0;
  onsideKicksAttempted: number = 0;
  onsideKicksConverted: number = 0;

  constructor(recordId: PlayerRecord["recordId"]) {
    this.recordId = recordId;
  }

  get distanceMovedBeforePass() {
    return averageOfArray(this.distanceMovedBeforePassArr);
  }

  get timeToPass() {
    return averageOfArray(this.timeToPassArr);
  }

  /**
   * Calculates passer rating according to NFL formula
   */
  private _calculatePasserRating() {
    if (this.passAttempts.all === 0) return 0;
    const a = limitNumberWithinRange(
      (this.passCompletions.all / this.passAttempts.all - 0.3) * 5,
      0,
      2.375
    );
    const b = limitNumberWithinRange(
      (this.passYards.all / this.passAttempts.all - 3) * 0.25,
      0,
      2.375
    );
    const c = limitNumberWithinRange(
      (this.touchdownsThrown / this.passAttempts.all) * 20,
      0,
      2.375
    );
    const d = limitNumberWithinRange(
      2.375 - (this.interceptionsThrown / this.passAttempts.all) * 25,
      0,
      2.375
    );

    return round(((a + b + c + d) / 6) * 100, 2);
  }

  updateStats(statsQuery: Partial<PlayerStatQuery>) {
    Object.entries(statsQuery).forEach((statQuery) => {
      const [statQueryKey, statQueryValue] = statQuery;
      // Check if the statQuery is a nested object
      const isNestedObj = isObject(statQueryValue);
      const isArray = Array.isArray(statQueryValue);

      // If its an object, we have to update a specific value in that object
      if (isNestedObj) {
        Object.entries(statQueryValue as MapSectionStat).forEach(
          (nestedStatQuery) => {
            const [nestedStatQueryKey, nestedStatQueryValue] = nestedStatQuery;
            this[`${statQueryKey}`][nestedStatQueryKey] += nestedStatQueryValue;
          }
        );

        return;
      }

      // If its an array, we have to append that value
      if (isArray) {
        (this[`${statQueryKey}`] as number[]).push(statQueryValue[0]);
        return;
      }

      // If not, just add them up
      this[`${statQueryKey}`] += statQueryValue;
    });
  }

  getStatsStringNormal(): string {
    const recStats = `Receiving | Rec: ${this.receptions.all} ${ICONS.SmallBlackSquare} Yds: ${this.receivingYards.all} ${ICONS.SmallBlackSquare} Yac: ${this.receivingYardsAfterCatch.all} ${ICONS.SmallBlackSquare} Ratt: ${this.rushingAttempts} ${ICONS.SmallBlackSquare} Ruyd: ${this.rushingYards} | TD: ${this.touchdownsReceived} ${ICONS.SmallBlackSquare} RuTD: ${this.touchdownsRushed}`;
    const qbStats = `Passing | Cmp/Att: ${this.passCompletions.all}/${
      this.passAttempts.all
    } ${ICONS.SmallBlackSquare} Pyds: ${this.passYards.all} | TD: ${
      this.touchdownsThrown
    } ${ICONS.SmallBlackSquare} Ints: ${this.interceptionsThrown} ${
      ICONS.SmallBlackSquare
    } Rating: ${this._calculatePasserRating()}`;
    const defensiveStats = `Defense | PD: ${this.passDeflections.all} ${ICONS.SmallBlackSquare} Tak: ${this.tackles} ${ICONS.SmallBlackSquare} Sak: ${this.sacks} ${ICONS.SmallBlackSquare} Ints: ${this.interceptionsReceived} ${ICONS.SmallBlackSquare} YdsAllowed: ${this.yardsAllowed.all}`;

    return `${recStats}\n${qbStats}\n${defensiveStats}`;
  }
}
