import HBClient from "../HBClient";
import { Play } from "../plays/basePlay";

class RoomClient {
  public client: HBClient;
  public play: Play = null;
  public offensiveTeam: 1 | 2 = 1;

  initClient(client: HBClient) {
    this.client = client;
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

  getPlayers() {
    return this.client.getPlayerList();
  }
}

const Room = new RoomClient();

export default Room;
