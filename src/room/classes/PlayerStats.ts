import { MapSectionName } from "../utils/MapSectionFinder";
import { isObject, sumObjectValues } from "../utils/utils";
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

interface IPlayerStat {
  receptions: PartialMapSection;
  receivingYards: PartialMapSection;
  rushingAttempts: number;
  rushingYards: number;
  touchdownsReceived: number;
  touchdownsRushed: number;
  fumbles: number;
  passAttempts: PartialMapSection;
  passCompletions: PartialMapSection;
  passYards: PartialMapSection;
  touchdownsThrown: number;
  interceptionsThrown: number;
  passDeflections: PartialMapSection;
  tackles: number;
  yardsAllowed: PartialMapSection;
  sacks: number;
  qbSacks: number;
  forcedFumbles: number;
  interceptionsReceived: number;
  penalties: number;
  penaltyYards: number;
}

export interface PlayerStatQuery {
  receptions: PartialMapSectionStatQuery;
  receivingYards: PartialMapSection;
  rushingAttempts: 1;
  rushingYards: number;
  touchdownsReceived: 1;
  touchdownsRushed: 1;
  fumbles: 1;
  passAttempts: PartialMapSectionStatQuery;
  passCompletions: PartialMapSectionStatQuery;
  passYards: PartialMapSection;
  touchdownsThrown: 1;
  interceptionsThrown: 1;
  passDeflections: PartialMapSectionStatQuery;
  tackles: 1;
  yardsAllowed: PartialMapSection;
  sacks: 1;
  qbSacks: 1;
  forcedFumbles: 1;
  interceptionsReceived: 1;
  penalties: 1;
  penaltyYards: number;
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
  // WR Stats
  receptions: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  receivingYards: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  rushingAttempts: number = 0;
  rushingYards: number = 0;
  touchdownsReceived: number = 0;
  touchdownsRushed: number = 0;
  fumbles: number = 0;

  // QB Stats
  passAttempts: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  passCompletions: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
  passYards: MapSectionStat = new EMPTY_MAP_SECTION_STAT();
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

  // Penalties
  penalties: number = 0;
  penaltyYards: number = 0;

  private get totalReceptions() {
    return sumObjectValues(this.receptions);
  }

  private get cornerReceptions() {
    return this.receptions.cornerBottom + this.receptions.cornerTop;
  }

  private get totalReceivingYards() {
    return sumObjectValues(this.receivingYards);
  }

  private get cornerReceivingYards() {
    return this.receivingYards.cornerBottom + this.receivingYards.cornerTop;
  }

  private get totalPassAttempts() {
    return sumObjectValues(this.passAttempts);
  }

  private get cornerPassAttempts() {
    return this.passAttempts.cornerBottom + this.passAttempts.cornerTop;
  }

  private get totalPassCompletions() {
    return sumObjectValues(this.passCompletions);
  }

  private get cornerPassCompletions() {
    return this.passCompletions.cornerBottom + this.passCompletions.cornerTop;
  }

  private get totalPassYards() {
    return sumObjectValues(this.passYards);
  }

  private get cornerPassYards() {
    return this.passYards.cornerBottom + this.passYards.cornerTop;
  }

  private get totalPassDeflections() {
    return sumObjectValues(this.passDeflections);
  }

  private get cornerPassDeflections() {
    return this.passDeflections.cornerBottom + this.passDeflections.cornerTop;
  }

  private get totalYardsAllowed() {
    return sumObjectValues(this.yardsAllowed);
  }

  private get cornerYardsAllowed() {
    return this.yardsAllowed.cornerBottom + this.yardsAllowed.cornerTop;
  }

  updateStats(statsQuery: Partial<PlayerStatQuery>) {
    console.log(statsQuery);
    Object.entries(statsQuery).forEach((statQuery) => {
      const [statQueryKey, statQueryValue] = statQuery;
      // Check if the statQuery is a nested object
      const isNestedObj = isObject(statQueryValue);

      if (isNestedObj) {
        Object.entries(statQueryValue as MapSectionStat).forEach(
          (nestedStatQuery) => {
            const [nestedStatQueryKey, nestedStatQueryValue] = nestedStatQuery;
            this[`${statQueryKey}`][nestedStatQueryKey] += nestedStatQueryValue;
            console.log(
              `${statQueryKey} ${nestedStatQueryKey} ${nestedStatQueryValue}`
            );
          }
        );

        return;
      }

      // If not, just add them up
      this[`${statQueryKey}`] += statQueryValue;
    });
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

  getStatsStringFull(): [string, string, string] {
    console.log(this);
    const offenseStatsString = `Rec: ${this.totalReceptions} (${this.cornerReceptions}-${this.receptions.middle}-${this.receptions.middle}) | RecYds: ${this.totalReceivingYards} (${this.cornerReceivingYards}-${this.receivingYards.middle}-${this.receivingYards.deep}) | RecTds: ${this.touchdownsReceived} | RushTds: ${this.touchdownsRushed} | Rush: ${this.rushingAttempts} | RushYds: ${this.rushingYards}`;
    const qbStatsString = `Att: ${this.totalPassAttempts} (${this.cornerPassAttempts}-${this.passAttempts.middle}-${this.passAttempts.deep}) | Cmp: ${this.totalPassCompletions} (${this.cornerPassCompletions}-${this.passCompletions.middle}-${this.passCompletions.deep}) | QbYds: ${this.totalPassYards} (${this.cornerPassYards}-${this.passYards.middle}-${this.passYards.deep}) | qbTds: ${this.touchdownsThrown} | Int: ${this.interceptionsThrown}`;
    const defenseStatsString = `PD: ${this.totalPassDeflections} (${this.cornerPassDeflections}-${this.passDeflections.middle}-${this.passDeflections.deep}) | Tak: ${this.tackles} | YardsAllowed: ${this.totalYardsAllowed} (${this.cornerYardsAllowed}-${this.yardsAllowed.middle}-${this.yardsAllowed.deep}) | FdFum: ${this.forcedFumbles} | IntR: ${this.interceptionsReceived} | Sak: ${this.sacks}`;

    return [offenseStatsString, qbStatsString, defenseStatsString];
  }

  // getStatsStringFull(): [string, string, string] {
  //   const offenseStatsString = `Rec: 0 (1-5-7) | RecYds: 123 (78-5-0) | RecTds: 0 | RushTds: 0 | Rush: 0 | RushYds: 0`;
  //   const qbStatsString = `Att: 5 (1-4-0) | Cmp: 2 (1-1-0) | QbYds: 247 (230-17-0) | qbTds: 2 | Int: 0`;
  //   const defenseStatsString = `PD: 0 (1-5-7) | Tak: 0 | YardsAllowed: 232 (23-2-5) | FdFum: 0 | IntR: 0 | Sak: 0`;

  //   return [offenseStatsString, qbStatsString, defenseStatsString];
  // }
}
