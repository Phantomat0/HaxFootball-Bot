import { PlayerReport, PlayerReportStats } from "../classes/PlayerReport";
import PlayerStats, { EMPTY_MAP_SECTION_STAT } from "../classes/PlayerStats";
import { TeamId } from "../HBClient";
import {
  PlayerRecord,
  PlayerSubstitution,
} from "../roomStructures/PlayerRecorder";
import { TEAMS } from "../utils/types";

export default class PlayerReportBuilder {
  private _playerRecord: PlayerRecord;
  private _playerStats: PlayerStats;
  private _winningTeamId: TeamId;

  constructor(
    playerRecord: PlayerRecord,
    playerStats: PlayerStats,
    winningTeamId: TeamId
  ) {
    this._playerRecord = playerRecord;
    this._playerStats = playerStats;
    this._winningTeamId = winningTeamId;
  }

  private _getMapSectionStatArray(
    mapSectionStat: Omit<EMPTY_MAP_SECTION_STAT, "all">
  ): [number, number, number, number] {
    const { cornerTop, cornerBottom, middle, deep, backwards } = mapSectionStat;
    return [cornerTop + cornerBottom, middle, deep, backwards];
  }

  private _mapReceivingStats(
    playerStats: PlayerStats
  ): PlayerReportStats["receiving"] {
    const rec = this._getMapSectionStatArray(playerStats.receptions);
    const recYd = this._getMapSectionStatArray(playerStats.receivingYards);
    const recYdAc = this._getMapSectionStatArray(
      playerStats.receivingYardsAfterCatch
    );
    const ruAtt = playerStats.rushingAttempts;
    const ruYd = playerStats.rushingYards;
    const tdRec = playerStats.touchdownsReceived;
    const tdRush = playerStats.touchdownsRushed;

    return {
      rec,
      recYd,
      recYdAc,
      ruAtt,
      ruYd,
      tdRec,
      tdRush,
    };
  }

  private _mapPassingStats(
    playerStats: PlayerStats
  ): PlayerReportStats["passing"] {
    const pa = this._getMapSectionStatArray(playerStats.passAttempts);
    const pc = this._getMapSectionStatArray(playerStats.passCompletions);
    const pYd = this._getMapSectionStatArray(playerStats.passYards);
    const pYdD = this._getMapSectionStatArray(playerStats.passYardsDistance);
    const tdT = playerStats.touchdownsThrown;
    const int = playerStats.interceptionsThrown;
    const qbSak = playerStats.qbSacks;
    const disBefPass = playerStats.distanceMovedBeforePass;
    const timToPass = playerStats.timeToPass;
    const cpa = playerStats.curvedPassAttempts;
    const cpc = playerStats.curvedPassCompletions;

    return {
      pa,
      pc,
      pYd,
      pYdD,
      tdT,
      int,
      qbSak,
      disBefPass,
      timToPass,
      cpa,
      cpc,
    };
  }

  private _mapTimePlayed() {
    return this._playerRecord.substitutions.reduce(
      (timePlayed, substitution, index) => {
        const prevSubstitution: PlayerSubstitution | null =
          this._playerRecord.substitutions[index - 1] ?? null;

        if (prevSubstitution === null) return timePlayed;

        if (substitution.type === "OUT") {
          if (prevSubstitution.type !== "IN") return timePlayed;

          const timePlayedDuringStretch =
            substitution.time - prevSubstitution.time;

          return timePlayed + timePlayedDuringStretch;
        }

        return timePlayed;
      },
      0
    );
  }

  private _getPlayerGameResult(): PlayerReportStats["result"] {
    const { team, wasAtEndOfGame } = this._playerRecord;
    if (team === this._winningTeamId && wasAtEndOfGame) return "w";
    if (wasAtEndOfGame === false) return "fl";
    if (this._winningTeamId === TEAMS.SPECTATORS) return "d";
    return "l";
  }

  private _mapStats(): PlayerReportStats {
    const receiving = this._mapReceivingStats(this._playerStats);
    const passing = this._mapPassingStats(this._playerStats);

    const mp = this._mapTimePlayed();

    return {
      posO: "qb",
      posD: "cb",
      mp,
      result: this._getPlayerGameResult(),
      receiving,
      passing,
      fgA: this._playerStats.fgAttempts,
      fgYdA: this._playerStats.fgYardsAttempted,
      fgM: this._playerStats.fgMade,
      fgYdM: this._playerStats.fgYardsMade,
      pen: this._playerStats.penalties,
    };
  }

  build(): PlayerReport {
    const { name, auth, ip, recordId, team } = this._playerRecord;
    const stats = this._mapStats();

    return {
      uuid: null,
      name,
      auth,
      ip,
      recordId,
      team,
      stats,
    };
  }
}
