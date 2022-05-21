import { client } from "..";
import { PlayableTeamId, PlayerObject, Position } from "../HBClient";
import Collection from "../utils/Collection";
import { getPlayerDiscProperties } from "../utils/haxUtils";
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
  private _playersStatic: {
    fielded: PlayerObject[];
    offense: PlayerObject[];
    defense: PlayerObject[];
  };
  playerPositionsMap = new Map<
    PlayerObject["id"],
    { team: PlayerObject["team"]; position: Position }
  >();

  savePlayerPositions() {
    this._playersStatic.fielded.forEach((player) => {
      const { position } = getPlayerDiscProperties(player.id);
      this.playerPositionsMap.set(player.id, {
        team: player.team,
        position: position,
      });
    });
  }

  updateStaticPlayerList(offensiveTeam: PlayableTeamId) {
    const players = client.getPlayerList();

    const fielded = players.filter((player) => player.team !== 0);

    const [offense, defense] = partition(
      fielded,
      (player) => player.team === offensiveTeam
    );

    this._playersStatic = {
      fielded: fielded,
      offense: offense,
      defense: defense,
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
