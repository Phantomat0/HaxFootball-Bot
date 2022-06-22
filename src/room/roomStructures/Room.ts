import Game from "../classes/Game";
import { PLAY_TYPES } from "../plays/BasePlayAbstract";
import KickOff from "../plays/Kickoff";
import { getRandomChars } from "../utils/utils";
import Marquee from "./Marquee";
import PlayerManager from "./Players/Players";

class RoomManager {
  // private _roomLink: string | null = null;
  readonly sessionId: string = getRandomChars(4).toLowerCase();
  readonly roomId: 1 = 1;
  private _game: Game | null = null;
  readonly players: PlayerManager = new PlayerManager();
  private _isBotOn: boolean = true;
  private _playerTestingId: number = 1;

  onRoomLoad() {
    Marquee.run();
  }

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
    this._game.players.updateStaticPlayerList(this.game.offenseTeamId);
    fieldedPlayers.forEach((player) => {
      this._game!.stats.maybeCreateStatProfile(player.playerObject!);
      this._game!.players.subIn(player.playerObject!, 0);
    });
    this.game.setPlay(new KickOff(0), null);
  }

  endGame() {
    this._game = null;
  }
}

export default new RoomManager();
