import { client } from "..";
import { PlayableTeamId, PlayerObject } from "../HBClient";
import Collection from "../utils/Collection";
import { partition } from "../utils/utils";

interface PlayerSubstitution {
  type: "IN" | "OUT";
  time: number;
}

type PlayerRecord = Pick<PlayerObject, "id" | "name" | "team"> & {
  substitutions: PlayerSubstitution[];
};

export default class PlayerRecorder {
  _players: Collection<PlayerObject["id"], PlayerRecord>;
  _playersStatic: {
    fielded: PlayerObject[];
    offense: PlayerObject[];
    defense: PlayerObject[];
    offenseNoQb: PlayerObject[];
  };

  updateStaticPlayerList(offensiveTeam: PlayableTeamId, quarterbackId: number) {
    const players = client.getPlayerList();

    const fielded = players.filter((player) => player.team !== 0);

    const [offense, defense] = partition(
      fielded,
      (player) => player.team === offensiveTeam
    );

    console.log(offense, defense);

    console.log("OFFENSE TEAM", offensiveTeam);

    console.log("QB", quarterbackId);

    const offenseNoQb = offense.filter((player) => player.id !== quarterbackId);

    console.log(offenseNoQb);

    this._playersStatic = {
      fielded: fielded,
      offense: offense,
      defense: defense,
      offenseNoQb: offenseNoQb,
    };
  }

  getFielded() {
    return this._playersStatic.fielded;
  }

  getDefense() {
    return this._playersStatic.defense;
  }

  getOffense() {
    return this._playersStatic.offense;
  }

  getOffenseDefense() {
    return {
      offense: this._playersStatic.offense,
      defense: this._playersStatic.defense,
    };
  }

  getOffenseNoQb() {
    return this._playersStatic.offenseNoQb;
  }

  /**
   * Runs if the player's team is changed
   */
  handlePlayerTeamChange(player: PlayerObject) {
    // First, lets check if the player has a record
    // const playerRecord = this._players.get(player.id);
  }

  subIn(player: PlayerObject) {}

  subOut(player: PlayerObject) {}
}
