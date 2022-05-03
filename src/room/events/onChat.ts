import Room, { client } from "..";
import { PlayerObject } from "../HBClient";
import Snap from "../plays/Snap";
import Ball from "../structures/Ball";

export default function onChat(player: PlayerObject, message: string) {
  if (!Room.isBotOn) return;
  if (message === "hike") {
    console.log("SET PLAY YEP");
    return Room.game.setPlay(new Snap(0, player));
  }
  if (message === "lmao") {
    console.log(Room);
  }

  if (message === "set") {
    Ball.setPosition({ x: 0, y: 0 });

    client.getPlayerList().forEach((p) => {
      client.setPlayerDiscProperties(p.id, { x: -150, y: 0 });
    });
  }

  // if (message === "hike") {
  //   if (down.getState("twoPoint")) return twoPointInit(author);
  //   return snapInit(author);
  // }

  // if (message === "score") {
  //   sendScoreBoard();
  // }

  // if (message === "admin1") {
  //   room.setPlayerAdmin(author.id, true);
  //   return false;
  // }
  // if (message === "fgset") return fieldGoalInit(author);
  // if (message === "2pt") {
  //   console.log(down.getState("canTwoPoint"));
  //   if (down.getState("canTwoPoint")) return twoPointPrepare(author);
  //   Chat.send("YOU ARE NOT ALLOWED TO TWO POINT AT THIS TIME");
  // }
  // if (message === "punt") return puntInit(author);

  // if (message === "swap1") {
  //   game.swapOffense();
  //   return false;
  // }
  // if (message === "kickoff") return kickOffInit(author);
  // if (message === "test1") return testFunc(author);
  // if (message === "reset1") {
  //   game.hardReset();
  //   return false;
  // }
  // if (message === "c") return testC(author);
  // if (message === "r") return testR(author);

  return true;
}
