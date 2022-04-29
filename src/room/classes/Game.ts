import { TEAMS } from "..";
import { PlayableTeamId, TeamId } from "../HBClient";
import { Play } from "../plays/BasePlay";
import Chat from "../roomStructures/Chat";
import PlayerRecorder from "../structures/PlayerRecorder";

export default class Game {
  score: {
    red: number;
    blue: number;
  } = {
    red: 0,
    blue: 0,
  };
  offenseTeamId: TeamId;
  play: Play | null = null;
  players: PlayerRecorder = new PlayerRecorder();

  updateStaticPlayers() {
    this.players.updateStaticPlayerList(
      this.offenseTeamId,
      this?.play?.getQuarterback().id ?? 0
    );
  }

  get defenseTeamId() {
    if (this.offenseTeamId === 1) return 2;
    if (this.offenseTeamId === 2) return 1;
    throw Error("DEFENSE IS 0");
  }

  setOffenseTeam(teamId: TeamId) {
    this.offenseTeamId === teamId;
  }

  swapOffense() {
    if (this.offenseTeamId === 1) {
      this.setOffenseTeam(2);
    } else {
      this.setOffenseTeam(1);
    }

    Chat.send(`Teams swapped! ${this.offenseTeamId} is now on offense`);
  }

  setPlay(play: Play): {
    valid: boolean;
    message?: string;
    sendToPlayer?: boolean;
  } {
    const verificationDetails = play.validate();

    console.log(verificationDetails);

    if (!verificationDetails.valid) return verificationDetails;

    console.log("WE GOT HERE");

    this.play = play;
    this.play.run();

    return {
      valid: true,
    };
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

  getTeamObjFromID(teamID: PlayableTeamId) {
    return teamID === TEAMS.RED ? this.red : this._blue;
  }
}
