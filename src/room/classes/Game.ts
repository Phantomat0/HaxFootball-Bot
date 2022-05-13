import { client, TEAMS } from "..";
import { PlayableTeamId, Position } from "../HBClient";
import { PLAY_TYPES } from "../plays/BasePlay";
import Snap from "../plays/Snap";
import Chat from "../roomStructures/Chat";
import PlayerRecorder from "../structures/PlayerRecorder";
import PlayerStatManager from "../structures/PlayerStatManager";
import Down from "./Down";
import WithStateStore from "./WithStateStore";

interface GameStore {
  kickOffPosition: Position;
}

export default class Game extends WithStateStore<GameStore, keyof GameStore> {
  score: {
    red: number;
    blue: number;
  } = {
    red: 0,
    blue: 0,
  };
  offenseTeamId: PlayableTeamId = 1;
  play: PLAY_TYPES | null = null;
  down: Down = new Down();
  players: PlayerRecorder = new PlayerRecorder();
  stats: PlayerStatManager = new PlayerStatManager();

  updateStaticPlayers() {
    this.players.updateStaticPlayerList(
      this.offenseTeamId,
      //@ts-ignore
      this.play?.getQuarterback().id ?? 0
    );
  }

  get defenseTeamId() {
    if (this.offenseTeamId === 1) return 2;
    if (this.offenseTeamId === 2) return 1;
    throw Error("DEFENSE IS 0");
  }

  setOffenseTeam(teamId: PlayableTeamId) {
    this.offenseTeamId = teamId;
  }

  private _getQuarterbackIdToUpdateStaticPlayers() {
    if (this.play && this.play instanceof Snap) {
      return this.play.getQuarterback().id;
    }

    return 0;
  }

  swapOffenseAndUpdatePlayers() {
    if (this.offenseTeamId === 1) {
      console.log("change it to 2");
      this.setOffenseTeam(2);
    } else {
      console.log("change it to 1");
      this.setOffenseTeam(1);
    }

    const quarterBackId = this._getQuarterbackIdToUpdateStaticPlayers();
    // Also update static players
    this.players.updateStaticPlayerList(this.offenseTeamId, quarterBackId);

    Chat.send(`Teams swapped! ${this.offenseTeamId} is now on offense`);
  }

  setPlay(play: PLAY_TYPES): {
    valid: boolean;
    message?: string;
    sendToPlayer?: boolean;
  } {
    const verificationDetails = play?.validateBeforePlayBegins();

    console.log(verificationDetails);

    if (!verificationDetails.valid) return verificationDetails;

    console.log("WE GOT HERE");

    this.play = play;

    this.play.run();

    return {
      valid: true,
    };
  }

  endPlay() {
    this.play = null;
  }

  setScore(teamID: PlayableTeamId, score: number) {
    teamID === TEAMS.RED ? this.score.red === score : this.score.blue === score;
    return this;
  }

  addScore(teamID: PlayableTeamId, score: number) {
    teamID === TEAMS.RED
      ? (this.score.red += score)
      : (this.score.blue += score);
    return this;
  }

  getTime() {
    return client.getScores().time ?? 0;
  }

  sendScoreBoard() {}
}
