import PlayerStats, {
  EMPTY_MAP_SECTION_STAT,
  PlayerStatQuery,
} from "../classes/PlayerStats";
import { PlayerObject } from "../HBClient";
import { DEBUG_MODE } from "../room.config";
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
    const playerRecord = Room.game.players.getPlayerRecordByPlayerId(playerId);
    if (!playerRecord) throw Error("Error finding player record");
    this.statsCollection.get(playerRecord.recordId)?.updateStats(statQuery);

    if (DEBUG_MODE)
      Chat.send(`STAT UPDATE: ${JSON.stringify(statQuery)}`, {
        color: 0xffef5c,
      });
  }

  getMVP() {
    const POINT_PER_STAT_MAP: Partial<Record<keyof PlayerStats, number>> = {
      // Receiving
      receptions: 3,
      receivingYards: 0.5,
      rushingYards: 2,
      touchdownsReceived: 7,
      touchdownsRushed: 7,

      // Passing
      passAttempts: -1,
      passCompletions: 2,
      passYards: 0.25,
      touchdownsThrown: 4,
      interceptionsThrown: -10,
      qbSacks: -4,

      // Defense
      passDeflections: 3,
      tackles: 3,
      yardsAllowed: -1,
      sacks: 6,
      forcedFumbles: 0,
      interceptionsReceived: 12,

      // Misc
      penalties: -5,
    };

    const playersStatsWithPoints = this.statsCollection
      .find()
      .map((statsObj) => {
        const statsPoints = Object.entries(statsObj).reduce(
          (
            acc: Partial<Record<keyof typeof POINT_PER_STAT_MAP, number>>,
            keyAndValueArr
          ) => {
            const [statName, keyValue] = keyAndValueArr;

            // If its an object, sum all its values
            const statValue =
              keyValue instanceof EMPTY_MAP_SECTION_STAT
                ? keyValue.all
                : keyValue;

            if (statName in POINT_PER_STAT_MAP === false) return acc;

            const statPointValue: number = POINT_PER_STAT_MAP[statName];

            acc[statName] = statValue * statPointValue;

            return acc;
          },
          {}
        );

        return { recordId: statsObj.recordId, statsPoints };
      });

    // Ok now just add up the points
    const eachPlayersPoints = playersStatsWithPoints.map((playerStatObj) => {
      const pointTotal = Object.values(playerStatObj.statsPoints).reduce(
        (a, b) => a + b
      );
      return {
        recordId: playerStatObj.recordId,
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
