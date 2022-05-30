import Game from "../classes/Game";
import { PLAY_TYPES } from "../plays/BasePlayAbstract";
import KickOff from "../plays/Kickoff";
import PlayerManager from "./Players";

export default class RoomClient {
  private _game: Game | null;
  readonly players: PlayerManager = new PlayerManager();
  private _isBotOn: boolean = true;
  private _playerTestingId: number = 1;

  /**
   * Returs the game when we know its defined
   */
  get game() {
    return this._game as Game;
  }

  get isBotOn() {
    return this._isBotOn;
  }

  turnBotOff() {
    this._isBotOn = false;
  }

  turnBotOn() {
    this._isBotOn = true;
  }

  getPlayerTestingId() {
    return this._playerTestingId;
  }

  setPlayerTestingId(id: number) {
    this._playerTestingId = id;
  }

  /**
   * Used when we know play has to be defined
   */
  getPlay<T extends PLAY_TYPES>() {
    if (!this.game.play) throw new Error("Game Error: Play is not defined");
    return this.game.play as T;
  }

  startNewGame() {
    this._game = new Game();
    const fieldedPlayers = this.players.getFielded();
    fieldedPlayers.forEach((player) => {
      this._game?.stats.maybeCreateStatProfile(player.playerObject!);
    });
    this.game.setPlay(new KickOff(0), null);
  }

  endGame() {
    this._game = null;
  }
}
