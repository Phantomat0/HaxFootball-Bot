import Chat from "../roomStructures/Chat";
import ChatMessage from "./ChatMessage";
import Player from "./Player";

// class CommandError {
//   message: string;
//   constructor(message: string) {
//     this.message = message;
//   }
// }

export default class CommandMessage extends ChatMessage {
  /**
   * The command object, can be null if the command is not found
   */
  command: any | null = null;

  /**
   * The name of the attempted command, doesn't have to be a legal command name
   */
  commandName: string;

  /**
   * All words that come after the paramater name
   */
  commandParamsStr: string;

  /**
   * All words that come after the paramater name, as an array
   */
  commandParamsArray: string[];

  constructor(message: string, player: Player) {
    super(message, player);

    const { cmdName, cmdParamsArray, cmdParamsStr } =
      this._extractCommandNameAndParams();

    this.commandParamsArray = cmdParamsArray;
    this.commandParamsStr = cmdParamsStr;
    this.commandName = cmdName;
  }

  private _extractCommandNameAndParams() {
    const splitMessage = this._splitContentByWhiteSpace();

    const [cmdNameWithPrefix, ...cmdParams] = splitMessage;

    const cmdName = cmdNameWithPrefix.substring(Chat.PREFIX.COMMAND.length);
    const cmdParamsString = cmdParams.join(" ");

    return {
      cmdName: cmdName,
      cmdParamsArray: cmdParams,
      cmdParamsStr: cmdParamsString,
    };
  }

  /**
   * Loads the command object using the command name
   * @return Returns false if the command was not found
   */
  loadCommand() {}

  validateAndRun() {
    // Validate the command, then run
  }
}
