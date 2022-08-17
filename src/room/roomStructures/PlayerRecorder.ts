import client from "..";
import { PlayableTeamId, PlayerObject, Position, TeamId } from "../HBClient";
import Room from "./Room";
import Collection from "../utils/Collection";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import { TEAMS } from "../utils/types";
import { partition } from "../utils/utils";
import Player from "../classes/Player";

export interface PlayerSubstitution {
  type: "IN" | "OUT";
  time: number;
  fromTeam: TeamId;
  toTeam: TeamId;
  wasLeave?: boolean;
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
  wasAtEndOfGame: boolean;
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
   * @return Player Record ID
   */
  handlePlayerTeamChange(player: PlayerObject, time: number): number {
    const { playerRecord, hasPlayerRecord } = this._getPlayerRecordSubIn(
      player.id
    );

    // If this is their first time playing, sub them in
    if (hasPlayerRecord === false) return this.subIn(player, time);

    // If they are moved to specs, sub them out
    if (player.team === TEAMS.SPECTATORS) return this.subOut(player, time, {});

    // We know they are swapping teams when their last sub was to a team that is not spec aka they are on the field
    const isSwappingTeams =
      playerRecord!.substitutions.length !== 0 &&
      playerRecord!.substitutions[playerRecord!.substitutions.length - 1]
        .toTeam !== TEAMS.SPECTATORS;

    if (isSwappingTeams) {
      this.subOut(player, time, {});
      return this.subIn(player, time);
    }

    // Otherwise, just sub them in
    return this.subIn(player, time);
  }

  getPlayerRecordById(playerId: PlayerObject["id"]) {
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
      return playerRecord!.recordId;
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
      wasAtEndOfGame: false,
    });

    return playerProfile.id;
  }

  subOut(
    player: PlayerObject,
    time: number,
    subOutOptions: { isAtGameEnd?: boolean; wasLeave?: boolean }
  ) {
    const playerRecord = this._getPlayerRecordSubOut(player.id);

    const { isAtGameEnd = false, wasLeave = false } = subOutOptions;

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
      wasLeave,
    });

    // If we are subbing at the end of the game, we wanna keep the team they ended on
    if (isAtGameEnd) {
      playerRecord!.wasAtEndOfGame = true;
    }

    return playerRecord.recordId;
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
}
