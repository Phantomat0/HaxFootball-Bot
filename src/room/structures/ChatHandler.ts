import ChatMessage from "../classes/ChatMessage";
import Chat from "../roomStructures/Chat";
import GameCommandHandler, {
  GameCommandError,
} from "../commands/GameCommandHandler";
import gameCommandsMap from "../commands/GameCommands";
import CommandHandler, { CommandError } from "../commands/CommandHandler";
import CommandMessage from "../classes/CommandMessage";
import Room, { TEAMS } from "..";
import COLORS from "../utils/colors";

export default class ChatHandler {
  static handleOffensiveMessage(chatObj: ChatMessage): false {
    // Room.discord.logger.log(
    //     `${ICONS.Exclamation} [OFFENSIVE MESSAGE] ${chatObj.message}`
    //   );
    //   player.ban({ reason: "Offensive message", description: chatObj.message });
    return false;
  }

  static maybeHandleTeamChat(chatObj: ChatMessage): false {
    if (chatObj.author.team === TEAMS.SPECTATORS) return false;

    const teamPlayers =
      chatObj.author.team === TEAMS.RED
        ? Room.players.getRed()
        : Room.players.getBlue();

    const teamColor =
      chatObj.author.team === TEAMS.RED
        ? COLORS.HaxballRed
        : COLORS.HaxballBlue;

    const msg = chatObj.content.substring(Chat.PREFIX.TEAMCHAT.length).trim();

    // Now concat the message and the playername
    const msgFormatted = `${chatObj.author.shortName}: ${msg}`;

    // Now send the message to the team players
    teamPlayers.forEach((player) => {
      Chat.send(msgFormatted, { color: teamColor, id: player.id });
    });

    return false;
  }

  static handlePlayerMuted(chatObj: ChatMessage): false {
    chatObj.reply("You are muted");
    return false;
  }

  static handleChatSilenced(chatObj: ChatMessage): false {
    chatObj.reply("The chat is silenced");
    return false;
  }

  static maybeHandleCommand(chatObj: ChatMessage): boolean {
    const cmdMessage = new CommandMessage(chatObj.content, chatObj.author);

    const cmdHandler = new CommandHandler(cmdMessage);
    try {
      const commandExists = cmdHandler.loadCommand();

      if (!commandExists)
        throw new CommandError(
          `Command ${cmdMessage.commandName} does not exist`
        );

      cmdHandler.validateAndRun();
    } catch (error) {
      // If we get an error, check what kind of error we have
      const isCommandError = error instanceof CommandError;

      if (isCommandError) {
        const commandError = error as CommandError;

        chatObj.replyError(commandError.errorMsg);
      } else {
        Chat.sendBotError(error.message);
      }

      return false;
    }

    // We know the command is defined since there werent any errors
    // return cmdHandler.command!.showCommand;
    return false;
  }

  static handleGameCommand(chatObj: ChatMessage): boolean {
    // We know game command is defined since we already checked with isGameCommand()
    const gameCommand = gameCommandsMap.get(chatObj.content)!;

    try {
      new GameCommandHandler(chatObj, gameCommand).validateAndRun();
    } catch (error) {
      // If we get an error, check what kind of error we have

      const isGameCommandError = error instanceof GameCommandError;

      if (isGameCommandError) {
        const gameError = error as GameCommandError;
        if (gameError.sendToPlayer) {
          // Send the error message to the player
          chatObj.replyError(gameError.message);
        }
      } else {
        Chat.sendBotError(error.message);
      }
      return false;
    }

    return gameCommand!.showCommand;
  }
}
