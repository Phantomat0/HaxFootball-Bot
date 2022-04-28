import client from "..";

class Chat {
  send(msg: string) {
    client.sendAnnouncement(msg);
  }
}

export default new Chat();
