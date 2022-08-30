import client from "..";
import { PlayableTeamId, PlayerObject, Position } from "../HBClient";
import { PLAY_TYPES } from "../plays/BasePlayAbstract";
import Chat from "../roomStructures/Chat";
import Room from "../roomStructures/Room";
import PlayerRecorder, { PlayerRecord } from "../roomStructures/PlayerRecorder";
import PlayerStatManager from "../structures/PlayerStatManager";
import { getPlayerDiscProperties, toClock } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import { TEAMS } from "../utils/types";
import Down from "./Down";
import WithStateStore from "./WithStateStore";
import { DISC_IDS, MAP_POINTS } from "../utils/map";

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
  timeOuts: { time: number; team: number }[] = [];

  /**
   * The current play class, always starts off as a KickOff with time of 0
   */
  play: PLAY_TYPES | null = null;
  down: Down = new Down();
  players: PlayerRecorder = new PlayerRecorder();
  stats: PlayerStatManager = new PlayerStatManager();
  private _canStartSnapPlay: boolean = true;
  private _isPaused: boolean = false;
  private _tightEndId: PlayerObject["id"] | null = null;
  private _isActive: boolean = true;

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

  get isActive() {
    return this._isActive;
  }

  getTightEnd() {
    return this._tightEndId;
  }

  setTightEnd(playerId: PlayerObject["id"] | null) {
    const oldTightEndId = this._tightEndId;
    this._tightEndId = playerId;
    if (playerId === null) {
      // Remove the players physics
      this._resetPlayersPhysics(oldTightEndId!);
      // Hide the tight end discs
      this.moveTightEndDiscs({ x: MAP_POINTS.HIDDEN, y: 0 });
      return;
    }
    this._tightEndId = playerId;
    this._setTightEndPhysicsAndDiscs(playerId);
  }

  updateStaticPlayers() {
    this.players.updateStaticPlayerList(this.offenseTeamId);
  }

  get defenseTeamId() {
    if (this.offenseTeamId === 1) return 2;
    return 1;
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

    // Reset tight end
    this.setTightEnd(null);
    // Also update static players
    this.players.updateStaticPlayerList(this.offenseTeamId);
  }

  addTeamTimeOut(teamId: PlayableTeamId) {
    this.timeOuts.push({ time: this.getTimeRounded(), team: teamId });
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
    this._resetAllPlayersPhysics();
    this.play = null;
  }

  endGame() {
    this._isActive = false;

    const mvpObj = this.stats.getMVP();

    if (!mvpObj) return;

    this.sendManOfTheMatch(mvpObj.recordId, mvpObj.pointTotal);
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
    return client.getScores()?.time ?? 0;
  }

  /**
   * Returns the time rounded
   */
  getTimeRounded() {
    return Math.round(this.getTime());
  }

  getClock() {
    const time = this.getTime();
    return toClock(time);
  }

  getScoreBoardStr() {
    return `${ICONS.RedSquare} ${this.score.red} -  ${this.score.blue} ${ICONS.BlueSquare}`;
  }

  sendScoreBoard() {
    Chat.send(this.getScoreBoardStr());
  }

  sendManOfTheMatch(recordId: PlayerRecord["recordId"], pointTotal: number) {
    const player = this.players.records.get(recordId);

    if (!player) return;

    Chat.send(`${ICONS.Star} MVP: ${player.name} | ${pointTotal} points`);
  }

  private _resetPlayersPhysics(playerId: PlayerObject["id"]) {
    const DEFAULT_BCOEFF = 0.75;
    const DEFAULT_INV_MASS = 0.8;

    if (this.checkIfPlayerIsTightEnd(playerId)) return;
    client.setPlayerDiscProperties(playerId, {
      bCoeff: DEFAULT_BCOEFF,
      invMass: DEFAULT_INV_MASS,
      radius: MAP_POINTS.PLAYER_RADIUS,
    });
  }

  /**
   * Resets all special physics that were applied during a play, except for TE
   */
  private _resetAllPlayersPhysics() {
    Room.players.getFielded().forEach((player) => {
      this._resetPlayersPhysics(player.id);
      client.setPlayerAvatar(player.id, null);
    });
  }

  private _setTightEndPhysicsAndDiscs(playerId: PlayerObject["id"]) {
    const TIGHT_END_INV_MASS = 0.35;

    // Set physics
    client.setPlayerDiscProperties(playerId, {
      radius: MAP_POINTS.TE_PLAYER_RADIUS,
      invMass: TIGHT_END_INV_MASS,
    });

    const { position } = getPlayerDiscProperties(playerId)!;

    // Move TE discs onto player
    this.moveTightEndDiscs(position);
  }

  checkIfPlayerIsTightEnd(playerId: PlayerObject["id"]) {
    return this._tightEndId === playerId;
  }

  moveTightEndDiscs(position: Position) {
    const JOINT_LENGTH = 13;

    DISC_IDS.TE.forEach((id, index) => {
      if (index === 0) {
        return client.setDiscProperties(id, position);
      }
      if (index === 1) {
        return client.setDiscProperties(id, {
          x: position.x,
          y: position.y + JOINT_LENGTH,
        });
      }
      if (index === 2) {
        return client.setDiscProperties(id, {
          x: position.x - JOINT_LENGTH,
          y: position.y,
        });
      }
      if (index === 3) {
        return client.setDiscProperties(id, {
          x: position.x,
          y: position.y - JOINT_LENGTH,
        });
      }
      if (index === 4) {
        return client.setDiscProperties(id, {
          x: position.x + JOINT_LENGTH,
          y: position.y,
        });
      }
    });
  }

  checkIfTightEndSwitchedTeamsOrLeft(playerId: PlayerObject["id"]) {
    if (playerId === this._tightEndId) this.setTightEnd(null);
  }
}
