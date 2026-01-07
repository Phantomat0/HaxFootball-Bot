import ChatMessage from "../classes/ChatMessage";
import HBClient from "../HBClient";
import Room from "../roomStructures/Room";
import ChatHandler from "../roomStructures/ChatHandler";

const onChat: HBClient["onPlayerChat"] = (player, message) => {
  const playerProfile = Room.players.playerCollection.get(player.id);

  if (!playerProfile || playerProfile.canPlay === false) return false;

  const chatObj = new ChatMessage(message, playerProfile);

  if (chatObj.isOffensive()) return ChatHandler.handleOffensiveMessage(chatObj);

  if (chatObj.startsWithTeamChatPrefix())
    return ChatHandler.maybeHandleTeamChat(chatObj);

  if (playerProfile.isMuted) return ChatHandler.handlePlayerMuted(chatObj);

  if (chatObj.isGameCommand()) return ChatHandler.handleGameCommand(chatObj);

  if (chatObj.startsWithCommandPrefix())
    return ChatHandler.maybeHandleCommand(chatObj);

  return true;
};

export default onChat;
