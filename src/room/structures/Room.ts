import HBClient from "../HBClient";

class RoomClient {
  private _client: HBClient;
  public lmao: any = 0;

  initClient(client: HBClient) {
    this._client = client;
  }

  getPlayers() {
    console.log(this._client.getPlayerList());
  }

  setSomething() {
    this.lmao = 5;
  }
}

const Room = new RoomClient();

export default Room;
