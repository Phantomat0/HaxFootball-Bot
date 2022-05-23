import { client } from "..";
import { PlayerObject } from "../HBClient";
import MessageFormatter from "../structures/MessageFormatter";
import COLORS from "../utils/colors";
import ICONS from "../utils/Icons";
import { ValueOf } from "../utils/types";

export const MESSAGE_STYLE = {
  Bold: "bold",
  Italic: "italic",
  Small: "small",
  Small_bold: "small-bold",
  Small_italic: "small-italic",
} as const;

export interface MessageOptions {
  /**
   * The emoji to be appended to the start of the message
   */
  icon?: ValueOf<typeof ICONS>;
  /**
   * Additional info that comes before the message
   */
  info?: string;
  /**
   * The id of the player to send the message to
   */
  id?: PlayerObject["id"];
  /**
   * The color of the message
   */
  color?: ValueOf<typeof COLORS>;
  /**
   * The font-style of the message
   */
  style?: ValueOf<typeof MESSAGE_STYLE>;
  /**
   * Sound of the message
   */
  sound?: 0 | 1 | 2;
  /**
   * Whether or not to auto shrink the message if it surpasses a certain character limit
   */
  autoSize?: boolean;
}

class Chat {
  PREFIX = {
    TEAMCHAT: "t",
    COMMAND: "!",
  };

  /**
   * If set to true, only admins can send messages
   */
  silenced: boolean = false;

  private _getAutoSizedStyle(
    message: string,
    originalStyle: MessageOptions["style"] | null
  ) {
    // If the string is too long, we auto adjust, only if we set autoSize to true, and we didn't already specify a style
    const AUTO_SIZE_MAX_STR_LENGTH = 100;

    return message.length >= AUTO_SIZE_MAX_STR_LENGTH
      ? MESSAGE_STYLE.Small
      : originalStyle;
  }

  private _sendMessage(message: string, msgOptions: MessageOptions) {
    const {
      icon = "",
      info = "",
      id = null,
      color = null,
      style = null,
      sound = null,
      autoSize = true,
    } = msgOptions ?? {};

    const messageStr = [icon, info, message]
      .map((str) => (str.length > 0 ? str + " " : str))
      .join("")
      .trim();

    // If our style wasn't set, and autoSize is true, adjust, otherwise, keep the style we had set
    const adjustedStyle =
      style === null && autoSize
        ? this._getAutoSizedStyle(message, style)
        : style;

    // Finally send the message
    client.sendAnnouncement(messageStr, id, color, adjustedStyle, sound);
  }

  /**
   * Sends a chat message
   */
  send(msg: string, msgOptions: MessageOptions = {}) {
    this._sendMessage(msg, msgOptions);
  }

  /**
   * Sends a message appending the gametime at the end if its over a certain time limit
   */
  sendMessageMaybeWithClock(message: string, time: number) {
    const msgMaybeWithTime = MessageFormatter.formatMessageMaybeWithClock(
      message,
      time
    );
    this._sendMessage(msgMaybeWithTime, {});
  }

  sendSuccess(message: string, options: MessageOptions = {}) {
    options.icon = ICONS.GreenCheck;
    options.color = COLORS.Lime;
    this._sendMessage(message, options);
  }

  sendAnnouncement(message: string, options: MessageOptions = {}) {
    options.color = COLORS.Orange;
    this._sendMessage(message, options);
  }

  sendNotification(message: string, options: MessageOptions = {}) {
    options.icon = ICONS.Bell;
    options.sound = 2;
    this._sendMessage(message, options);
  }

  sendWarning(message: string, options: MessageOptions = {}) {
    options.icon = ICONS.OrangeTriangle;
    options.sound = 2;
    this._sendMessage(message, options);
  }

  sendError(message: string, options: MessageOptions = {}) {
    options.icon = ICONS.Exclamation;
    options.color = COLORS.LightRed;
    this._sendMessage(message, options);
  }

  sendBotError(message: string, options: MessageOptions = {}) {
    options.icon = ICONS.Construction;
    options.color = COLORS.Yellow;
    this._sendMessage(message, options);
  }
}

export default new Chat();
