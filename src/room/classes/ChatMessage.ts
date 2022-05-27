import Chat, { MessageOptions } from "../roomStructures/Chat";
import gameCommandsMap from "../commands/GameCommands";
import COLORS from "../utils/colors";
import Player from "./Player";

export default class ChatMessage {
  /**
   * The content of the message, trimmed
   */
  readonly content: string;

  /**
   * The time the message was sent at
   */
  readonly createdAt: Date;

  /**
   * The author of the message
   */
  readonly author: Player;

  constructor(message: string, player: Player) {
    this.content = message.trim();
    this.author = player;
    this.createdAt = new Date();
  }

  /**
   * Split all the words by whitespace and makes them lowercase
   */
  protected _splitContentByWhiteSpaceAndToLower(): string[] {
    return this.content.toLowerCase().split(/\s+/);
  }

  /**
   * Check if the message contains any offensive language
   */
  isOffensive(): boolean {
    return false;
  }

  /**
   * Checks if it is a game command
   */
  isGameCommand(): boolean {
    return gameCommandsMap.has(this.content.toLowerCase());
  }

  /**
   * Check if the message starts with the command prefix
   */
  startsWithCommandPrefix(): boolean {
    return this.content.startsWith(Chat.PREFIX.COMMAND);
  }

  /**
   * Check if the message starts with the teamchat prefix
   */
  startsWithTeamChatPrefix(): boolean {
    const [firstWord = null] = this._splitContentByWhiteSpaceAndToLower();
    // First word has to equal, that way if someone starts a sentence with
    // t, it doesnt flag as team chat
    return firstWord === Chat.PREFIX.TEAMCHAT;
  }

  /**
   * Reply to the message
   */
  reply(msg: string, options: MessageOptions = {}) {
    options.color = COLORS.Gray;
    options.id = this.author?.id;
    Chat.send(msg, options);
  }

  replyError(msg: string, options: MessageOptions = {}) {
    options.id = this.author?.id;
    Chat.sendError(msg, options);
  }

  replySuccess(msg: string, options: MessageOptions = {}) {
    options.id = this.author?.id;
    Chat.sendSuccess(msg, options);
  }

  announce(msg: string, options: MessageOptions = {}) {
    Chat.sendAnnouncement(msg, options);
  }
}
