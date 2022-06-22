import client from "..";
import { PlayableTeamId, PlayerObject } from "../HBClient";
import { PLAY_TYPES } from "../plays/BasePlayAbstract";
import Chat from "../roomStructures/Chat";
import Room from "../roomStructures/Room";
import PlayerRecorder from "../roomStructures/PlayerRecorder";
import PlayerStatManager from "../structures/PlayerStatManager";
import { toClock } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import { TEAMS } from "../utils/types";
import Down from "./Down";
import WithStateStore from "./WithStateStore";

interface GameStore {
  safetyKickoff: true;
  canTwoPoint: boolean;
  twoPointAttempt: boolean;
  curvePass: true;
}

export default class Game extends WithStateStore<GameStore, keyof GameStore> {
  /**
   * Score of the game
   */
  score: {
    red: number;
    blue: number;
  } = {
    red: 0,
    blue: 0,
  };

  redTeamName: string = "Red";
  blueTeamName: string = "Blue";

  offenseTeamId: PlayableTeamId = 1;

  timeoutsUsed: {
    red: number;
    blue: number;
  } = {
    red: 0,
    blue: 0,
  };

  /**
   * The current play class, always starts off as a KickOff with time of 0
   */
  play: PLAY_TYPES | null = null;
  down: Down = new Down();
  players: PlayerRecorder = new PlayerRecorder();
  stats: PlayerStatManager = new PlayerStatManager();
  private _canStartSnapPlay: boolean = true;
  private _isPaused: boolean = false;

  constructor() {
    super();
    this.updateStaticPlayers();
  }

  setIsPaused(bool: boolean) {
    this._isPaused = bool;
  }

  get isPaused() {
    return this._isPaused;
  }

  updateStaticPlayers() {
    this.players.updateStaticPlayerList(this.offenseTeamId);
  }

  get defenseTeamId() {
    if (this.offenseTeamId === 1) return 2;
    if (this.offenseTeamId === 2) return 1;
    throw Error("DEFENSE IS 0");
  }

  get canStartSnapPlay() {
    return this._canStartSnapPlay;
  }

  setOffenseTeam(teamId: PlayableTeamId) {
    this.offenseTeamId = teamId;
  }

  swapOffenseAndUpdatePlayers() {
    if (this.offenseTeamId === 1) {
      this.setOffenseTeam(2);
    } else {
      this.setOffenseTeam(1);
    }
    // Also update static players
    this.players.updateStaticPlayerList(this.offenseTeamId);
  }

  incrementTeamTimeout(teamId: PlayableTeamId) {
    if (teamId === TEAMS.RED) return this.timeoutsUsed.red++;
    if (teamId === TEAMS.BLUE) return this.timeoutsUsed.blue++;
    return null;
  }

  startSnapDelay() {
    this._canStartSnapPlay = false;
    // If the game is paused, set the delay for 4000 seconds

    if (this._isPaused) {
      setTimeout(() => {
        this._canStartSnapPlay = true;
      }, 4000);
      return;
    }

    setTimeout(() => {
      this._canStartSnapPlay = true;
    }, 2000);
  }

  /**
   * Set the gamess current play, while first validating and throwing an error if validation occurs
   */
  setPlay(play: PLAY_TYPES, player: PlayerObject | null) {
    // This will throw an error if any errors occur, and will be resolved by the ChatHandler
    play?.validateBeforePlayBegins(player);

    this.play = play;

    // Anything that deals with game state should be done in the prepare method
    this.play.prepare();
    this.clearState();
    Room.game.down.setPreviousDownAsCurrentDown();
    this.play.run();
  }

  endPlay() {
    // Play might be null because play could be ended before it even starts like off a snap penalty
    this.play?.cleanUp();
    this.resetPlayersPhysics();
    this.play = null;
  }

  setScore(teamID: PlayableTeamId, score: number) {
    teamID === TEAMS.RED ? (this.score.red = score) : (this.score.blue = score);
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

  getClock() {
    const time = this.getTime();
    return toClock(time);
  }

  getScoreBoardStr() {
    return `${ICONS.RedSquare} ${this.score.red} -  ${this.score.blue} ${ICONS.BlueSquare}`;
  }

  sendScoreBoard() {
    Chat.send(
      `${ICONS.RedSquare} ${this.score.red} -  ${this.score.blue} ${ICONS.BlueSquare}`
    );
  }

  sendManOfTheMatch() {
    const manOfTheMatchObj = this.stats.determineManOfTheMatch();

    if (manOfTheMatchObj === null) return;

    const { auth, pointTotal } = manOfTheMatchObj;

    const player = Room.players.playerCollection.findOne({
      auth: auth,
    });

    if (player === null) return;

    Chat.send(`${ICONS.Star} MVP: ${player.name} | ${pointTotal} points`);
  }

  /**
   * Resets all special physics that were applied during a play
   */
  private resetPlayersPhysics() {
    Room.players.getFielded().forEach((player) => {
      client.setPlayerDiscProperties(player.id, { bCoeff: 0.75, invMass: 0.8 });
    });
  }
}
