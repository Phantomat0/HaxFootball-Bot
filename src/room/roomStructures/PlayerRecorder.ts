import client from "..";
import { PlayableTeamId, PlayerObject, Position, TeamId } from "../HBClient";
import Room from "./Room";
import Collection from "../utils/Collection";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import { TEAMS } from "../utils/types";
import { partition } from "../utils/utils";
import Player from "../classes/Player";

interface PlayerSubstitution {
  type: "IN" | "OUT";
  time: number;
  fromTeam: TeamId;
  toTeam: TeamId;
}

export interface PlayerRecord {
  name: Player["name"];
  team: PlayerObject["team"];
  /**
   * This id will never change, even if the player leaves and rejoins on the same auth
   */
  readonly recordId: Player["id"];
  readonly auth: Player["auth"];
  readonly ip: Player["ip"];
  /**
   * Id's used by the player
   */
  ids: Player["id"][];
  substitutions: PlayerSubstitution[];
}

/**
 * Saves valuable player data for the entire duration of the game, even if a player leaves the room
 */
export default class PlayerRecorder {
  records: Collection<PlayerRecord["recordId"], PlayerRecord> =
    new Collection();
  private _playersStatic: {
    fielded: PlayerObject[];
    offense: PlayerObject[];
    defense: PlayerObject[];
  } = {
    fielded: [],
    offense: [],
    defense: [],
  };
  playerPositionsMap = new Map<
    PlayerObject["id"],
    { team: PlayerObject["team"]; position: Position }
  >();

  savePlayerPositions() {
    this._playersStatic.fielded.forEach((player) => {
      const { position } = getPlayerDiscProperties(player.id)!;
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
  handlePlayerTeamChange(player: PlayerObject, time: number) {
    const { playerRecord, hasPlayerRecord } = this._getPlayerRecordSubIn(
      player.id
    );

    // If this is their first time playing, sub them in
    if (hasPlayerRecord === false) return this.subIn(player, time);

    // If they are moved to specs, sub them out
    if (player.team === TEAMS.SPECTATORS) return this.subOut(player, time);

    // Did they just rejoin, meaning they will have a new ID that isn't in their IDs
    if (playerRecord!.ids.includes(player.id) === false) {
      playerRecord!.team === player.team;
      return this.subIn(player, time);
    }

    // Otherwise they are just being moved from red to blue or vice versa, so sub them out and sub back in
    this.subOut(player, time);
    this.subIn(player, time);
  }

  private _getPlayerRecordSubOut(playerId: PlayerObject["id"]) {
    const playerRecord = this.records.findOne({ ids: [playerId] });

    if (!playerRecord)
      throw Error(`No player record found with ID ${playerId}`);

    return playerRecord;
  }

  private _getPlayerRecordSubIn(playerId: PlayerObject["id"]) {
    const playerProfile = Room.players.playerCollection.get(playerId);

    if (!playerProfile)
      throw Error(`No player profile found for id ${playerId}`);

    const playerRecord = this.records.findOne({ auth: playerProfile.auth });

    const hasPlayerRecord = Boolean(playerRecord);

    return { playerRecord, hasPlayerRecord, playerProfile };
  }

  getPlayerRecordById(playerId: PlayerObject["id"]) {
    console.log(this.records);
    console.log(playerId);
    return this.records.findOne({
      ids: [playerId],
    });
  }

  subIn(player: PlayerObject, time: number) {
    const { playerRecord, hasPlayerRecord, playerProfile } =
      this._getPlayerRecordSubIn(player.id);

    if (hasPlayerRecord) {
      // Check that this is the right substitution
      const lastSubstitution =
        playerRecord!.substitutions[playerRecord!.substitutions.length - 1];
      if (lastSubstitution?.type === "IN")
        throw Error(
          `Player ${playerProfile.name} was attempted to be subbed in but is already on the field`
        );
      playerRecord!.substitutions.push({
        time,
        type: "IN",
        fromTeam: playerRecord!.team,
        toTeam: player.team,
      });
      playerRecord!.team = player.team;
      playerRecord!.ids = [...playerRecord!.ids, player.id];
      playerRecord!.name = player.name;
      return;
    }

    // If no record, create one, and then substitute
    this.records.set(playerProfile.id, {
      auth: playerProfile.auth,
      recordId: playerProfile.id,
      ids: [playerProfile.id],
      name: playerProfile.name,
      ip: playerProfile.ip,
      team: player.team,
      substitutions: [
        { time, type: "IN", fromTeam: TEAMS.SPECTATORS, toTeam: player.team },
      ],
    });
  }

  subOut(player: PlayerObject, time: number, isAtGameEnd: boolean = false) {
    const playerRecord = this._getPlayerRecordSubOut(player.id);

    if (playerRecord.substitutions.length === 0)
      throw Error(
        `Player ${playerRecord.name} was subbed out, but did not have a record of being subbed in`
      );

    // Alright lets sub him out
    playerRecord!.substitutions.push({
      time,
      type: "OUT",
      fromTeam: playerRecord!.team,
      toTeam: TEAMS.SPECTATORS,
    });

    // If we are subbing at the end of the game, we wanna keep the team they ended on
    if (isAtGameEnd === false) {
      playerRecord!.team = TEAMS.SPECTATORS;
    }
  }
}
