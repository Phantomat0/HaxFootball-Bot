import Room from "..";
import Player from "../classes/Player";
import PlayerStats, { PlayerStatQuery } from "../classes/PlayerStats";
import { PlayerObject } from "../HBClient";
import { SHOW_DEBUG_CHAT } from "../roomConfig";
import Chat from "../roomStructures/Chat";
import Collection from "../utils/Collection";

export default class PlayerStatManager {
  statsCollection: Collection<Player["auth"], PlayerStats> = new Collection<
    Player["auth"],
    PlayerStats
  >();

  maybeCreateStatProfile(player: PlayerObject) {
    const playerProfile = Room.players.playerCollection.get(player.id);

    if (!playerProfile) throw Error("UH OH NO PROFILE FOUND");

    const hasStatProfile = this.statsCollection.has(playerProfile.auth);

    if (hasStatProfile) return;

    const playerStats = new PlayerStats({
      name: playerProfile.name,
      auth: playerProfile.auth,
      id: playerProfile.id,
    });

    this.statsCollection.set(playerProfile.auth, playerStats);
  }

  updatePlayerStat(
    playerId: PlayerObject["id"],
    statQuery: Partial<PlayerStatQuery>
  ) {
    const playerProfile = Room.players.playerCollection.get(playerId);
    if (!playerProfile) throw Error("Player is not in the room anymore");

    if (SHOW_DEBUG_CHAT) Chat.send(`STAT UPDATE: ${JSON.stringify(statQuery)}`);

    this.statsCollection.get(playerProfile.auth)?.updateStats(statQuery);
  }

  determineManOfTheMatch() {
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
      totalYardsAllowed: 0,
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

        return { playerAuth: statsObj.player.auth, statsPoints };
      });

    // Ok now just add up the points

    const eachPlayersPoints = playersStatsWithPoints.map((playerStatObj) => {
      const pointTotal = Object.values(playerStatObj.statsPoints).reduce(
        (a, b) => a + b
      );
      return {
        playerAuth: playerStatObj.playerAuth,
        pointTotal,
      };
    });

    // Alas, now lets find the player with the highest point total and return his auth

    const playerWithMostPoints = eachPlayersPoints.reduce(
      (prev, current) =>
        prev.pointTotal > current.pointTotal ? prev : current,
      { playerAuth: "", pointTotal: 0 }
    );

    if (playerWithMostPoints.pointTotal === 0) return null;

    return {
      auth: playerWithMostPoints.playerAuth,
      pointTotal: playerWithMostPoints.pointTotal,
    };
  }
}
