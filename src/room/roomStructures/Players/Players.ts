import client from "../..";
import Player from "../../classes/Player";
import { FullPlayerObject, PlayerObject } from "../../HBClient";
import Collection from "../../utils/Collection";
import { TEAMS } from "../../utils/types";
import BanManager from "./Bans";
import MuteManager from "./Mutes";

export default class PlayerManager {
  readonly playerCollection: Collection<PlayerObject["id"], Player> =
    new Collection();
  readonly muted = new MuteManager();
  readonly bans = new BanManager();

  findOne(searchQuery: Partial<Player>) {
    return this.playerCollection.findOne(searchQuery);
  }

  find(searchQuery?: Partial<Player>) {
    return this.playerCollection.find(searchQuery);
  }

  /**
   * Search by name, searches first by exact match, then .startsWith
   */
  getByName(name: string): Player | null | -1 {
    const players = this.getPlayable();

    // First lets search for exact
    const playersExactName = players.find(
      (player) => player.lowerName === name
    );

    if (playersExactName) return playersExactName;

    const playersMatchingName = players.filter((player) =>
      player.lowerName.startsWith(name)
    );

    // Return -1 if there are multiple players found
    if (playersMatchingName.length > 1) return -1;

    // Null if no one is found
    if (playersMatchingName.length === 0) return null;

    // Return first result
    return playersMatchingName[0];
  }

  createAndAdd(player: FullPlayerObject): Player {
    const playerProfile: Player = this._createPlayer(player);
    this.playerCollection.set(player.id, playerProfile);
    return playerProfile;
  }

  /**
   * Delete the player from the playerlist
   */
  delete(player: PlayerObject): Player | null {
    const playerProfile = this.playerCollection.get(player.id);
    if (!playerProfile) return null;
    this.playerCollection.delete(player.id);
    return playerProfile;
  }

  /**
   * Get players who are playable and are not AFK
   */
  getPlayable() {
    return this._sortByOrderInPlayerList(
      this.playerCollection.find({ canPlay: true, isAFK: false })
    );
  }

  /**
   * Get players who are playable and are not AFK on Spectators
   */
  getPlayableSpecs() {
    return this._sortByOrderInPlayerList(
      this.playerCollection.find({
        canPlay: true,
        team: TEAMS.SPECTATORS,
        isAFK: false,
      })
    );
  }

  getRed() {
    return this._sortByOrderInPlayerList(
      this.playerCollection.find({ team: TEAMS.RED })
    );
  }

  getBlue() {
    return this._sortByOrderInPlayerList(
      this.playerCollection.find({ team: TEAMS.BLUE })
    );
  }

  getFielded() {
    return this._sortByOrderInPlayerList(
      this.playerCollection
        .find()
        .filter((player) => player.team !== TEAMS.SPECTATORS)
    );
  }

  private _createPlayer(player: FullPlayerObject): Player {
    return new Player(player);
  }

  /**
   * Sort them by the order they appear in the list, that way we know who is higher in the specs list for example
   */
  private _sortByOrderInPlayerList(playerArr: Player[]) {
    const clientPlayerList = client.getPlayerList();

    const idToPositionMap: { [key: PlayerObject["id"]]: number } =
      clientPlayerList.reduce((acc, currPlayer) => {
        acc[currPlayer.id] = clientPlayerList.findIndex(
          (player) => player.id === currPlayer.id
        );
        return acc;
      }, {});

    return playerArr.sort((a, b) => {
      return idToPositionMap[a.id] - idToPositionMap[b.id];
    });
  }
}
