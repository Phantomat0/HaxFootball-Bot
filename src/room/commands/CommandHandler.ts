import CommandMessage from "../classes/CommandMessage";
import Player from "../classes/Player";
import Chat from "../roomStructures/Chat";
import Room from "../roomStructures/Room";
import { plural, toOrdinalSuffix } from "../utils/utils";
import {
  Command,
  COMMAND_PARAM_TYPES,
  getCommandByNameOrAlias,
} from "./Commands";

export class CommandError {
  errorMsg: string;
  constructor(errorMsg: string) {
    this.errorMsg = errorMsg;
  }
}

export default class CommandHandler {
  /**
   * Returns the player object, will always be a player since we already do a check on if the player exists in the command param validation
   * @param name
   * @returns Player Object
   */
  static getPlayerByNameAlways(name: string) {
    return Room.players.getByName(name) as Player;
  }

  commandMsg: CommandMessage;
  /**
   * The command object, can be null if the command is not found
   */
  command: Command | null;

  constructor(commandMsg: CommandMessage) {
    this.commandMsg = commandMsg;
  }

  /**
   * Loads the command object using the command name
   * @return Returns false if the command was not found
   */
  loadCommand() {
    const command = getCommandByNameOrAlias(this.commandMsg.commandName);

    if (!command) {
      this.command = null;
      return false;
    }
    this.command = command;
    return true;
  }

  private _validateCommandPermissions(): this | never {
    const {
      name: cmdName,
      permissions: { level, muted, game, notDuringPlay },
    } = this.command!;

    // Check if the player has the right admin level
    if (level > this.commandMsg.author.adminLevel) {
      if (level === 1)
        throw new CommandError(`Command ${cmdName} requires admin to use`);
      throw new CommandError(
        `Command ${cmdName} requires a higher admin level to use`
      );
    }

    // Check if the chat is silenced or when the player is muted
    if ((!muted && this.commandMsg.author.isMuted) || (muted && Chat.silenced))
      throw new CommandError(`You cannot use command ${cmdName} while muted`);

    // Check if there is a game going on
    if (game && (Room.game === null || Room.game?.isActive === false))
      throw new CommandError(
        `Command ${cmdName} requires a game to be in session`
      );

    if (notDuringPlay && Room?.game?.play)
      throw new CommandError(`Command ${cmdName} cannot be run during a play`);

    return this;
  }

  private _checkPlayerParamType() {
    const player = Room.players.getByName(this.commandMsg.commandParamsStr);

    console.log("CHECK PLAYER", player);

    if (player === null)
      throw new CommandError(
        `Player ${this.commandMsg.commandParamsStr} does not exist in the room`
      );

    if (player === -1)
      throw new CommandError(
        `Multiple players were found starting with the name ${this.commandMsg.commandParamsStr} in the room`
      );
  }

  private _checkArrayParamTypes(
    paramType: string[],
    param: string,
    index: number
  ) {
    const passesParamCheck = paramType.includes(param);

    const commandParamsStr = paramType.join(" ");

    if (!passesParamCheck)
      throw new CommandError(
        `The ${toOrdinalSuffix(index + 1)} option to command ${
          this.command!.name
        } must be one of the following: ${commandParamsStr}`
      );
  }

  private _checkNumberParamType(param: string, index: number) {
    const numberAsANumber = parseInt(param);

    const isValidNumber = isNaN(numberAsANumber) === false;

    console.log(isValidNumber);

    if (!isValidNumber)
      throw new CommandError(
        `The ${toOrdinalSuffix(index + 1)} option to command ${
          this.command!.name
        } must be a number`
      );
  }

  private _validateCommandParams(): this | never {
    const {
      name: cmdName,
      params: { min, max, types, skipMaxCheck = false },
    } = this.command!;

    // Check length of arguments
    const minArgStr = plural(min, "option", "options");
    const maxArgStr = plural(max, "option", "options");

    if (this.commandMsg.commandParamsArray.length < min)
      throw new CommandError(`Command ${cmdName} requires ${minArgStr}.`);
    if (
      this.commandMsg.commandParamsArray.length > max &&
      skipMaxCheck === false
    ) {
      if (max === 0)
        throw new CommandError(
          `Command ${cmdName} does not accept any options.`
        );

      // If its a player name, then the player name may include spaces, which will lead to a large number of arguments parsed
      if (!skipMaxCheck)
        throw new CommandError(`Command ${cmdName} accepts only ${maxArgStr}.`);
    }

    // Check arguments type

    // Return if no type is specified or no arguments were passed into the call
    if (types.length === 0 || this.commandMsg.commandParamsArray.length === 0)
      return this;

    // Validate each argument that is passed in
    this.commandMsg.commandParamsArray.forEach((param, index) => {
      const paramType = this.command!.params.types[index];

      // If the function has custom arguments, skip
      if (paramType === COMMAND_PARAM_TYPES.CUSTOM) return;

      // If its an array, check that the argument matches one of the options in the argument types array
      if (Array.isArray(paramType))
        return this._checkArrayParamTypes(paramType, param, index);

      // If its a player
      if (paramType === COMMAND_PARAM_TYPES.PLAYER)
        return this._checkPlayerParamType();

      // If its a number
      if (paramType === COMMAND_PARAM_TYPES.NUMBER)
        return this._checkNumberParamType(param, index);
    });

    return this;
  }

  validateAndRun() {
    // Validate the command, then run
    this._validateCommandPermissions();
    this._validateCommandParams();

    this.command!.run(this.commandMsg).catch((error) => {
      // If we get an error, check what kind of error we have
      const isCommandError = error instanceof CommandError;

      if (isCommandError) {
        const commandError = error as CommandError;

        this.commandMsg.replyError(commandError.errorMsg);
      } else {
        console.log(error);
        Chat.sendBotError(error.message);
      }
    });
  }
}
