import Room from "..";
import ChatMessage from "../classes/ChatMessage";
import { PlayerObject } from "../HBClient";
import Chat from "../roomStructures/Chat";
import ChatHandler from "../structures/ChatHandler";

export default function onChat(player: PlayerObject, message: string) {
  const playerProfile = Room.players.playerCollection.get(player.id);

  if (!playerProfile || playerProfile.canPlay === false) return false;

  const chatObj = new ChatMessage(message, playerProfile);

  if (chatObj.isOffensive()) return ChatHandler.handleOffensiveMessage(chatObj);
  if (chatObj.startsWithTeamChatPrefix())
    return ChatHandler.maybeHandleTeamChat(chatObj);

  // if (player.muted) return ChatHandler.handlePlayerMuted(chatObj);

  if (chatObj.isGameCommand()) return ChatHandler.handleGameCommand(chatObj);

  if (message === "stats") {
    Room.game.stats.statsCollection.find().forEach((player) => {
      const playerStats = player.getStatsStringMini();

      Chat.send(`${player.player.name} || ${playerStats}`);
    });
  }

  return true;
}
