import CommandMessage from "../classes/CommandMessage";
import Player from "../classes/Player";
import Chat from "../roomStructures/Chat";
import Room from "../roomStructures/Room";
import ParamParser from "./ParamParser";
import { plural } from "../utils/utils";
import { CommandObj, getCommandByNameOrAlias } from "./Commands";

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
  command: CommandObj | null;

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
    this.command = command as unknown as CommandObj;
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
    if (game && Room.game === null)
      throw new CommandError(
        `Command ${cmdName} requires a game to be in session`
      );

    if (notDuringPlay && Room?.game?.play)
      throw new CommandError(`Command ${cmdName} cannot be run during a play`);

    return this;
  }

  private _parseParamsIntoInput() {
    const { name: cmdName, params: cmdParams, usage: cmdUsage } = this.command!;

    const indexOfFirstOptionalParam = cmdParams.findIndex(
      (paramParser) => paramParser.isOptional
    );
    const containsString = cmdParams.some(
      (paramParser) =>
        paramParser.type === "string" ||
        paramParser.type === "player" ||
        (Array.isArray(paramParser._dataType) &&
          paramParser._dataType.some(
            (orParser) =>
              orParser instanceof ParamParser && orParser.type === "string"
          ))
    );
    // Validate the number of arguments first
    const minArguments =
      indexOfFirstOptionalParam === -1
        ? cmdParams.length
        : indexOfFirstOptionalParam;
    const maxArguments = containsString ? Infinity : cmdParams.length;

    const usageOrParamTypesMapped =
      cmdUsage.length > 0
        ? cmdUsage.join(` or ${Chat.PREFIX.COMMAND}`)
        : `${cmdName} ${cmdParams
            .map((parser) => `[${parser.dataName}]`)
            .join(" ")}`;

    const minArgumentsStr = plural(minArguments, "option", "options");
    const maxArgumentsStr = plural(maxArguments, "option", "options");

    if (this.commandMsg.commandParamsArray.length < minArguments)
      throw new CommandError(
        `Command ${cmdName} requires at least ${minArgumentsStr} i.e ${Chat.PREFIX.COMMAND}${usageOrParamTypesMapped}`
      );

    if (this.commandMsg.commandParamsArray.length > maxArguments)
      throw new CommandError(
        `Command ${cmdName} accepts only ${maxArgumentsStr} i.e ${Chat.PREFIX.COMMAND}${usageOrParamTypesMapped}`
      );

    // Validate the arguments themselves

    const input: any[] = [];

    for (let [index, paramParser] of cmdParams.entries()) {
      const isStringOrPlayer =
        paramParser.type === "string" || paramParser.type === "player";

      // if its a string or player, get the rest of the command args
      const arg = isStringOrPlayer
        ? this.commandMsg.commandParamsArray.splice(index, Infinity).join(" ")
        : this.commandMsg.commandParamsArray[index];

      const parsed = (paramParser as ParamParser<unknown, false>).parse(arg);

      input.push(parsed);
    }

    return input;
  }

  validateAndRun() {
    // Validate the command, then run
    this._validateCommandPermissions();
    const input = this._parseParamsIntoInput();

    this.command!.run({ cmd: this.commandMsg, input }).catch((error) => {
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
