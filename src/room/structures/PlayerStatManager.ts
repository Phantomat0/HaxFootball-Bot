import PlayerStats, { PlayerStatQuery } from "../classes/PlayerStats";
import { PlayerObject } from "../HBClient";
import { SHOW_DEBUG_CHAT } from "../room.config";
import Chat from "../roomStructures/Chat";
import { PlayerRecord } from "../roomStructures/PlayerRecorder";
import Room from "../roomStructures/Room";
import Collection from "../utils/Collection";

export default class PlayerStatManager {
  statsCollection: Collection<PlayerRecord["recordId"], PlayerStats> =
    new Collection<PlayerRecord["recordId"], PlayerStats>();

  maybeCreateStatProfile(recordId: PlayerRecord["recordId"]) {
    const hasStatProfile = this.statsCollection.has(recordId);
    if (hasStatProfile) return;
    const playerStats = new PlayerStats(recordId);
    this.statsCollection.set(recordId, playerStats);
  }

  updatePlayerStat(
    playerId: PlayerObject["id"],
    statQuery: Partial<PlayerStatQuery>
  ) {
    const playerRecord = Room.game.players.getPlayerRecordById(playerId);
    if (!playerRecord) throw Error("Error finding player record");
    this.statsCollection.get(playerRecord.recordId)?.updateStats(statQuery);

    if (SHOW_DEBUG_CHAT)
      Chat.send(`STAT UPDATE: ${JSON.stringify(statQuery)}`, {
        color: 0xffef5c,
      });
  }

  getMVP() {
    const POINT_PER_STAT_MAP: Partial<Record<keyof PlayerStats, number>> = {
      // Receiving
      totalReceptions: 1,
      totalReceivingYards: 0.1,
      rushingYards: 1,
      touchdownsReceived: 6,
      touchdownsRushed: 6,

      // Passing
      totalPassAttempts: 0,
      totalPassCompletions: 1,
      totalPassYards: 0.04,
      touchdownsThrown: 4,
      interceptionsThrown: -12,
      qbSacks: 0,

      // Defense
      totalPassDeflections: 5,
      tackles: 3,
      totalYardsAllowed: -1,
      sacks: 6,
      forcedFumbles: 0,
      interceptionsReceived: 12,

      // Misc
      penalties: -10,
    };

    const playersStatsWithPoints = this.statsCollection
      .find()
      .map((statsObj) => {
        const statsPoints = Object.entries(
          Object.getOwnPropertyDescriptors(statsObj)
        ).reduce(
          (
            acc: Partial<Record<keyof typeof POINT_PER_STAT_MAP, number>>,
            propKeyDescriptor
          ) => {
            const [statName, keyValue] = propKeyDescriptor;

            const statValue =
              (keyValue.value || (keyValue.get && keyValue.get())) ?? 0;

            if (statName in POINT_PER_STAT_MAP === false) return acc;

            const statPointValue: number = POINT_PER_STAT_MAP[statName];

            acc[statName] = statValue * statPointValue;

            return acc;
          },
          {}
        );

        return { playerAuth: statsObj.recordId, statsPoints };
      });

    // Ok now just add up the points

    const eachPlayersPoints = playersStatsWithPoints.map((playerStatObj) => {
      const pointTotal = Object.values(playerStatObj.statsPoints).reduce(
        (a, b) => a + b
      );
      return {
        recordId: playerStatObj.playerAuth,
        pointTotal,
      };
    });

    // Alas, now lets find the player with the highest point total and return his auth
    const playerWithMostPoints = eachPlayersPoints.reduce(
      (prev, current) =>
        prev.pointTotal > current.pointTotal ? prev : current,
      { recordId: 0, pointTotal: 0 }
    );

    if (playerWithMostPoints.pointTotal === 0) return null;

    return {
      recordId: playerWithMostPoints.recordId,
      pointTotal: playerWithMostPoints.pointTotal,
    };
  }
}
