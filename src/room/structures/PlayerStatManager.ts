import Room from "..";
import Player from "../classes/Player";
import PlayerStats, { PlayerStatQuery } from "../classes/PlayerStats";
import { PlayerObject } from "../HBClient";
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

    console.log(`STAT UPDATE: ${JSON.stringify(statQuery)}`);
    Chat.send(`STAT UPDATE: ${JSON.stringify(statQuery)}`);

    this.statsCollection.get(playerProfile.auth)?.updateStats(statQuery);
  }
}
