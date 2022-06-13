import ICONS from "../utils/Icons";
import { MapSectionName } from "../utils/MapSectionFinder";
import {
  isObject,
  limitNumberWithinRange,
  round,
  sumObjectValues,
} from "../utils/utils";
import Player from "./Player";

type MapSectionStat = Record<MapSectionName, number>;

type MapSectionStatQuery = Record<MapSectionName, 1>;

class EMPTY_MAP_SECTION_STAT {
  cornerTop = 0;
  cornerBottom = 0;
  middle = 0;
  deep = 0;
  behind = 0;
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

  // Defense
  passDeflections: PartialMapSectionStatQuery;
  tackles: 1;
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
  fumbles: 1;
  penalties: 1;
  onsideKicksAttempted: 1;
  onsideKicksConverted: 1;
}

export default class PlayerStats implements IPlayerStat {
  player: {
    name: Player["name"];
    id: Player["id"];
    auth: Player["auth"];
  };

  constructor({
    name,
    id,
    auth,
  }: {
    name: Player["name"];
    id: Player["id"];
    auth: Player["auth"];
  }) {
    this.player = {
      name: name,
      id: id,
      auth: auth,
    };
  }
  // Receiving
  receptions: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  receivingYards: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  receivingYardsAfterCatch: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  rushingAttempts: number = 0;
  rushingYards: number = 0;
  touchdownsReceived: number = 0;
  touchdownsRushed: number = 0;

  // Passing
  passAttempts: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  passCompletions: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  passYards: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  passYardsDistance: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  touchdownsThrown: number = 0;
  interceptionsThrown: number = 0;
  qbSacks: number = 0;

  // Defense
  passDeflections: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  tackles: number = 0;
  yardsAllowed: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
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
  fumbles: number = 0;
  penalties: number = 0;
  onsideKicksAttempted: number = 0;
  onsideKicksConverted: number = 0;

  get totalReceptions() {
    return sumObjectValues(this.receptions);
  }

  get cornerReceptions() {
    return this.receptions.cornerBottom + this.receptions.cornerTop;
  }

  get totalReceivingYards() {
    return sumObjectValues(this.receivingYards);
  }

  get cornerReceivingYards() {
    return this.receivingYards.cornerBottom + this.receivingYards.cornerTop;
  }

  get totalYardsAfterCatch() {
    return sumObjectValues(this.receivingYardsAfterCatch);
  }

  get totalPassAttempts() {
    return sumObjectValues(this.passAttempts);
  }

  get cornerPassAttempts() {
    return this.passAttempts.cornerBottom + this.passAttempts.cornerTop;
  }

  get totalPassCompletions() {
    return sumObjectValues(this.passCompletions);
  }

  get cornerPassCompletions() {
    return this.passCompletions.cornerBottom + this.passCompletions.cornerTop;
  }

  get totalPassYards() {
    return sumObjectValues(this.passYards);
  }

  get cornerPassYards() {
    return this.passYards.cornerBottom + this.passYards.cornerTop;
  }

  get totalPassDeflections() {
    return sumObjectValues(this.passDeflections);
  }

  get cornerPassDeflections() {
    return this.passDeflections.cornerBottom + this.passDeflections.cornerTop;
  }

  get totalYardsAllowed() {
    return sumObjectValues(this.yardsAllowed);
  }

  get cornerYardsAllowed() {
    return this.yardsAllowed.cornerBottom + this.yardsAllowed.cornerTop;
  }

  /**
   * Calculates passer rating according to NFL formula
   */
  private _calculatePasserRating() {
    if (this.totalPassAttempts === 0) return 0;
    const a = limitNumberWithinRange(
      (this.totalPassCompletions / this.totalPassAttempts - 0.3) * 5,
      0,
      2.375
    );
    const b = limitNumberWithinRange(
      (this.totalPassYards / this.totalPassAttempts - 3) * 0.25,
      0,
      2.375
    );
    const c = limitNumberWithinRange(
      (this.touchdownsThrown / this.totalPassAttempts) * 20,
      0,
      2.375
    );
    const d = limitNumberWithinRange(
      2.375 - (this.interceptionsThrown / this.totalPassAttempts) * 25,
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

      if (isNestedObj) {
        Object.entries(statQueryValue as MapSectionStat).forEach(
          (nestedStatQuery) => {
            const [nestedStatQueryKey, nestedStatQueryValue] = nestedStatQuery;
            this[`${statQueryKey}`][nestedStatQueryKey] += nestedStatQueryValue;
          }
        );

        return;
      }

      // If not, just add them up
      this[`${statQueryKey}`] += statQueryValue;
    });
  }

  getStatsStringNormal(): string {
    console.log(this);
    const recStats = `Receiving | Rec: ${this.totalReceptions} ${ICONS.SmallBlackSquare} Yds: ${this.totalReceivingYards} ${ICONS.SmallBlackSquare} Yac: ${this.totalYardsAfterCatch} ${ICONS.SmallBlackSquare} Ratt: ${this.rushingAttempts} ${ICONS.SmallBlackSquare} Ruyd: ${this.rushingYards} | TD: ${this.touchdownsReceived} ${ICONS.SmallBlackSquare} RuTD: ${this.touchdownsRushed}`;
    const qbStats = `Quarterback | Cmp/Att: ${this.totalPassCompletions}/${
      this.totalPassAttempts
    } ${ICONS.SmallBlackSquare} Pyds: ${this.totalPassYards} | TD: ${
      this.touchdownsThrown
    } ${ICONS.SmallBlackSquare} Ints: ${this.interceptionsThrown} ${
      ICONS.SmallBlackSquare
    } Rating: ${this._calculatePasserRating()}`;
    const defensiveStats = `Defense | PD: ${this.totalPassDeflections} ${ICONS.SmallBlackSquare} Tak: ${this.tackles} ${ICONS.SmallBlackSquare} Sak: ${this.sacks} ${ICONS.SmallBlackSquare} Ints: ${this.interceptionsReceived} ${ICONS.SmallBlackSquare} YdsAllowed: ${this.totalYardsAllowed}`;

    return `${recStats}\n${qbStats}\n${defensiveStats}`;
  }

  getStatsStringMini(): string {
    console.log(this);
    const receivingStats =
      this.totalReceptions > 0
        ? `Rec: ${this.totalReceptions} | RecYds: ${this.totalReceivingYards}`
        : null;
    const recTds =
      this.touchdownsReceived > 0 ? `RecTds: ${this.touchdownsReceived}` : null;
    const qbStats =
      this.totalPassAttempts > 0
        ? `Att: ${this.totalPassAttempts} (${this.cornerPassAttempts}-${this.passAttempts.middle}-${this.passAttempts.deep}) | Cmp: ${this.totalPassCompletions} (${this.cornerPassCompletions}-${this.passCompletions.middle}-${this.passCompletions.deep}) | QbYds: ${this.totalPassYards} (${this.cornerPassYards}-${this.passYards.middle}-${this.passYards.deep})`
        : null;
    const qbTouchdowns =
      this.touchdownsThrown > 0 ? `qbTds: ${this.touchdownsThrown}` : null;
    const qbInts =
      this.interceptionsThrown > 0 ? `Int: ${this.interceptionsThrown}` : null;

    const defense =
      this.totalPassDeflections > 0 || this.tackles > 0
        ? `PD: ${this.totalPassDeflections} | Tak: ${this.tackles}`
        : null;

    return [receivingStats, recTds, qbStats, qbTouchdowns, qbInts, defense]
      .filter((stat) => stat !== null)
      .join(" | ");
  }

  getStatsStringFull(): string {
    console.log(this);
    const offenseStatsString = `Rec: ${this.totalReceptions} (${this.cornerReceptions}-${this.receptions.middle}-${this.receptions.middle}) | RecYds: ${this.totalReceivingYards} (${this.cornerReceivingYards}-${this.receivingYards.middle}-${this.receivingYards.deep}) | RecTds: ${this.touchdownsReceived} | RushTds: ${this.touchdownsRushed} | Rush: ${this.rushingAttempts} | RushYds: ${this.rushingYards}`;
    const qbStatsString = `Att: ${this.totalPassAttempts} (${this.cornerPassAttempts}-${this.passAttempts.middle}-${this.passAttempts.deep}) | Cmp: ${this.totalPassCompletions} (${this.cornerPassCompletions}-${this.passCompletions.middle}-${this.passCompletions.deep}) | QbYds: ${this.totalPassYards} (${this.cornerPassYards}-${this.passYards.middle}-${this.passYards.deep}) | qbTds: ${this.touchdownsThrown} | Int: ${this.interceptionsThrown}`;
    const defenseStatsString = `PD: ${this.totalPassDeflections} (${this.cornerPassDeflections}-${this.passDeflections.middle}-${this.passDeflections.deep}) | Tak: ${this.tackles} | YardsAllowed: ${this.totalYardsAllowed} (${this.cornerYardsAllowed}-${this.yardsAllowed.middle}-${this.yardsAllowed.deep}) | FdFum: ${this.forcedFumbles} | IntR: ${this.interceptionsReceived} | Sak: ${this.sacks}`;

    return `${offenseStatsString}\n${qbStatsString}\n${defenseStatsString}`;
  }

  // getStatsStringFull(): [string, string, string] {
  //   const offenseStatsString = `Rec: 0 (1-5-7) | RecYds: 123 (78-5-0) | RecTds: 0 | RushTds: 0 | Rush: 0 | RushYds: 0`;
  //   const qbStatsString = `Att: 5 (1-4-0) | Cmp: 2 (1-1-0) | QbYds: 247 (230-17-0) | qbTds: 2 | Int: 0`;
  //   const defenseStatsString = `PD: 0 (1-5-7) | Tak: 0 | YardsAllowed: 232 (23-2-5) | FdFum: 0 | IntR: 0 | Sak: 0`;

  //   return [offenseStatsString, qbStatsString, defenseStatsString];
  // }
}
