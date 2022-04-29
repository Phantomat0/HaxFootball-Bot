import Game from "../classes/Game";
import HBClient from "../HBClient";

export default class RoomClient {
  public client: HBClient;
  public game: Game = new Game();
  private _isBotOn: boolean = true;

  constructor(client: HBClient) {
    this.client = client;
  }

  get isBotOn() {
    return this._isBotOn;
  }

  /**
   * Used when we know play has to be defined
   */
  getPlay() {
    if (!this.game.play) throw new Error("Game Error: Play is not defined");
    return this.game.play;
  }

  getPlayers() {
    return this.client.getPlayerList();
  }
}
