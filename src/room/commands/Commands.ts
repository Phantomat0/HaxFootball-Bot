import CommandMessage from "../classes/CommandMessage";
import Player, { PlayerAdminLevel } from "../classes/Player";
import { PlayableTeamId } from "../HBClient";
import Chat from "../roomStructures/Chat";
import Ball from "../roomStructures/Ball";
import PreSetCalculators from "../structures/PreSetCalculators";
import Collection from "../utils/Collection";
import { getTeamStringFromId } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import { ValueOf } from "../utils/helperTypes";
import { getRandomInt } from "../utils/utils";
import CommandHandler, { CommandError } from "./CommandHandler";
import Room from "../roomStructures/Room";
import { TEAMS } from "../utils/types";

export type CommandName = string;

export const COMMAND_PARAM_TYPES = {
  PLAYER: "Player name or ID",
  PLAYER_OR_USER: "Player or user,",
  NUMBER: "Number",
  CUSTOM: "Custom",
};

export type ParamType = ValueOf<typeof COMMAND_PARAM_TYPES> | string[];

export interface CommandPermissions {
  /**
   * The minimum admin level required
   */
  level: PlayerAdminLevel;
  /**
   * If muted players can use this command
   */
  muted: boolean;
  /**
   * If there needs to be a current game going on
   */
  game: boolean;
  /**
   * Dont run if there is a play going on
   */
  notDuringPlay: boolean;
}

export interface CommandParams {
  skipMaxCheck?: boolean;
  min: number;
  max: number;
  types: ParamType[];
}

export interface Command {
  name: string;
  alias: string[];
  description: string;
  usage: string[];
  showCommand: boolean;
  permissions: CommandPermissions;
  params: CommandParams;
  run(cmd: CommandMessage): Promise<void>;
}

export function getCommandsAccessibleToPlayer(player: Player) {
  const commands = commandsMap.find();

  return commands.filter((cmd) => cmd.permissions.level <= player.adminLevel);
}

export function getCommandByNameOrAlias(cmdName: string) {
  const commandByName = commandsMap.get(cmdName) ?? null;

  const commandByAlias = commandsMap.findOne({
    alias: [cmdName],
  });

  return commandByName ?? commandByAlias ?? null;
}

const commandsMap = new Collection<CommandName, Command>([
  [
    "help",
    {
      name: "help",
      alias: [],
      description:
        "Returns the list of room commands or returns the description of a given command",
      usage: ["help [commandName]"],
      showCommand: false,
      permissions: {
        level: 0,
        muted: true,
        game: false,
        notDuringPlay: false,
      },
      params: {
        min: 0,
        max: 1,
        types: [COMMAND_PARAM_TYPES.CUSTOM],
      },
      async run(cmd: CommandMessage) {
        if (cmd.hasNoParams()) {
          // Output the name of all the commands the player can use
          const commandsAvail = getCommandsAccessibleToPlayer(cmd.author);

          const cmdsAsString: string = commandsAvail
            .map((cmd) => cmd.name)
            .join(", ");

          cmd.reply(`Commands: ${cmdsAsString}`);
          return;
        }

        // Show info about a particular command
        const cmdObj = getCommandByNameOrAlias(cmd.commandParamsStr);

        if (!cmdObj)
          throw new CommandError(
            `Command (${cmd.commandParamsStr}) does not exist`
          );

        const cmdUsage =
          cmdObj.usage.length === 0
            ? `${cmdObj.name}`
            : cmdObj.usage.join(`, ${Chat.PREFIX.COMMAND}`);

        const cmdAlias =
          cmdObj.alias.length === 0 ? "" : ` [${cmdObj.alias.join(", ")}] `;

        cmd.reply(
          `${cmdObj.name}${cmdAlias}: ${cmdObj.description} | ${Chat.PREFIX.COMMAND}${cmdUsage}`
        );
      },
    },
  ],
  [
    "commands",
    {
      name: "commands",
      alias: ["cmds"],
      description: "Returns the list of room commands",
      usage: [],
      showCommand: false,
      permissions: {
        level: 0,
        muted: true,
        game: false,
        notDuringPlay: false,
      },
      params: {
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        const commandsAvail = getCommandsAccessibleToPlayer(cmd.author);

        const cmdsAsString: string = commandsAvail
          .map((cmd) => cmd.name)
          .join(", ");

        cmd.reply(`Commands: ${cmdsAsString}`);
      },
    },
  ],
  [
    "info",
    {
      name: "info",
      alias: [],
      description: "Returns helpful command info",
      usage: [],
      showCommand: false,
      permissions: {
        level: 0,
        muted: true,
        game: false,
        notDuringPlay: false,
      },
      params: {
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        cmd.reply(
          `cp | Curved pass\n!setlos (yard) | Sets the line of scrimmage position\n!setdown (down) (yard) | Sets the down and distance \n!setscore (team) (score) | Sets the score of a team\n!setplayers | Sets the players in front of ball | !dd | Returns the down and distance \n!swapo | Swaps offense and defense`
        );
      },
    },
  ],
  [
    "discord",
    {
      name: "discord",
      alias: [],
      description: "Returns the discord server link",
      usage: [],
      showCommand: false,
      permissions: {
        level: 0,
        muted: true,
        game: false,
        notDuringPlay: false,
      },
      params: {
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        cmd.reply(`Discord: discord.gg/VdrD2p7`);
      },
    },
  ],
  [
    "rules",
    {
      name: "rules",
      alias: [],
      description: "Returns the rules of the game",
      usage: [],
      showCommand: false,
      permissions: {
        level: 0,
        muted: true,
        game: false,
        notDuringPlay: false,
      },
      params: {
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        cmd.reply(
          `Rules of the game\n ${ICONS.SmallBlackSquare} Offense | One player is a passer, while the rest of the team runs to get open for a catch. Catch the ball by touching it after a pass and run to the opposing team's goal.\n${ICONS.SmallBlackSquare} Defense | Guard the receivers and prevent them from catching the ball. Defense has to be behind the blue line at all times.\n${ICONS.YellowSquare} It is illegal for a defender to stand right infront of the blue line without defending another player \n${ICONS.Running} Run the ball by touching the back of the quarterback.\n ${ICONS.Target} Intercept the ball by kicking the ball through the goal posts after a pass\n ${ICONS.Dizzy} Rush the quarterback after 12 seconds or 3 seconds after he has moved the ball `
        );
      },
    },
  ],
  [
    "cre",
    {
      name: "cre",
      alias: [],
      description: "Explains crowding",
      usage: [],
      showCommand: false,
      permissions: {
        level: 1,
        muted: true,
        game: false,
        notDuringPlay: false,
      },
      params: {
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        cmd.announce(
          `You cannot stand in front of the blue line for more than 3 seconds without an offensive player being present.`
        );
      },
    },
  ],
  [
    "stats",
    {
      name: "stats",
      alias: [],
      description: "Returns your stats or the stats of another player",
      usage: ["stats", "stats tda"],
      showCommand: false,
      permissions: {
        level: 0,
        muted: true,
        game: false,
        notDuringPlay: false,
      },
      params: {
        skipMaxCheck: true,
        min: 0,
        max: 1,
        types: [COMMAND_PARAM_TYPES.PLAYER],
      },
      async run(cmd: CommandMessage) {
        if (Room.game === null && Room.statsStore === null)
          throw new CommandError("No game in progress");

        const statsCollection =
          Room.game === null
            ? Room.statsStore!
            : Room.game.stats.statsCollection!;

        // If no params get the stats of the player using the command
        if (cmd.hasNoParams()) {
          const playerStats = statsCollection.get(cmd.author.auth);

          if (!playerStats)
            throw new CommandError(`You do not have any stats yet`);

          const playerStatsString = playerStats.getStatsStringNormal();

          cmd.reply(`${playerStatsString}`, {
            autoSize: false,
          });
          return;
        }

        // Otherwise get the stats of a selected player

        const playerToGetStatsOf = CommandHandler.getPlayerByNameAlways(
          cmd.commandParamsStr
        );

        const playersStatProfile = statsCollection.get(playerToGetStatsOf.auth);

        if (!playersStatProfile)
          throw new CommandError(
            `Player ${playerToGetStatsOf.shortName} does not have any stats yet`
          );

        const playerStats = playersStatProfile.getStatsStringNormal();

        cmd.reply(`Stats ${playerToGetStatsOf.shortName}\n${playerStats}`, {
          autoSize: false,
        });
      },
    },
  ],
  [
    "score",
    {
      name: "score",
      alias: [],
      description: "Returns the score of the current game",
      usage: [],
      showCommand: false,
      permissions: {
        level: 0,
        muted: true,
        game: true,
        notDuringPlay: false,
      },
      params: {
        skipMaxCheck: false,
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        const scoreboardStr = Room.game.getScoreBoardStr();
        cmd.reply(scoreboardStr);
      },
    },
  ],
  [
    "setscore",
    {
      name: "setscore",
      alias: ["ss"],
      description: "Sets the score for a team",
      usage: ["setscore blue 7", "setscore r 10"],
      showCommand: true,
      permissions: {
        level: 1,
        muted: true,
        game: true,
        notDuringPlay: false,
      },
      params: {
        skipMaxCheck: false,
        min: 2,
        max: 2,
        types: [["blue", "b", "red", "r"], COMMAND_PARAM_TYPES.NUMBER],
      },
      async run(cmd: CommandMessage) {
        const [team, score] = cmd.commandParamsArray;

        const scoreParsed = Math.round(parseInt(score));

        if (scoreParsed > 100) throw new CommandError(`Score exceeds limit`);

        // If negative
        if (scoreParsed < 0)
          throw new CommandError("Score must be a positive integer");

        // Figure out which team to update

        const isRedTeam = team === "red" || team === "r";
        const isBlueTeam = team === "blue" || team === "b";

        if (isRedTeam) {
          Room.game.setScore(TEAMS.RED as PlayableTeamId, scoreParsed);
        }

        if (isBlueTeam) {
          Room.game.setScore(TEAMS.BLUE as PlayableTeamId, scoreParsed);
        }

        cmd.announce(`Score updated by ${cmd.author.shortName}`);
        Room.game.sendScoreBoard();
      },
    },
  ],
  [
    "setlos",
    {
      name: "setlos",
      alias: ["sl"],
      description: "Sets the line of scrimmage position",
      usage: ["setlos blue 7", "sl r 38"],
      showCommand: true,
      permissions: {
        level: 1,
        muted: true,
        game: true,
        notDuringPlay: true,
      },
      params: {
        skipMaxCheck: false,
        min: 2,
        max: 2,
        types: [["blue", "b", "red", "r"], COMMAND_PARAM_TYPES.NUMBER],
      },
      async run(cmd: CommandMessage) {
        const [team, yardage] = cmd.commandParamsArray;

        const yardageParsed = Math.round(parseInt(yardage));

        if (yardageParsed > 50 || yardageParsed < 1)
          throw new CommandError(`Yardage must be a number between 1 and 50`);

        // Figure out which team to update
        const teamHalf =
          team === "red" || team === "r" ? TEAMS.RED : TEAMS.BLUE;

        const yardAsDistance = PreSetCalculators.getPositionOfTeamYard(
          yardageParsed,
          teamHalf as PlayableTeamId
        );

        Room.game.down.setLOS(yardAsDistance);
        Room.game.down.setBallAndFieldMarkersPlayEnd();
        Room.game.down.hardSetPlayers();

        cmd.announce(`LOS moved by ${cmd.author.shortName}`);
        Room.game.down.sendDownAndDistance();
      },
    },
  ],
  [
    "revert",
    {
      name: "revert",
      alias: ["rv"],
      description: "Reverts the LOS, down, and distance",
      usage: [],
      showCommand: true,
      permissions: {
        level: 1,
        muted: true,
        game: true,
        notDuringPlay: true,
      },
      params: {
        skipMaxCheck: false,
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        const { down, losX, yardsToGet } = Room.game.down.previousDown;

        console.log(losX);
        Room.game.down.setDown(down);
        Room.game.down.setYardsToGet(yardsToGet);

        Room.game.down.setLOS(losX);
        Room.game.down.setBallAndFieldMarkersPlayEnd();
        Room.game.down.hardSetPlayers();

        cmd.announce(`Play reverted by ${cmd.author.shortName}`);
        Room.game.down.sendDownAndDistance();
      },
    },
  ],
  [
    "setplayers",
    {
      name: "setplayers",
      alias: ["setp", "gfi"],
      description: "Sets the players infront of the LOS",
      usage: [],
      showCommand: true,
      permissions: {
        level: 0,
        muted: true,
        game: true,
        notDuringPlay: true,
      },
      params: {
        skipMaxCheck: false,
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        Room.game.down.hardSetPlayers();
        cmd.replySuccess("Players set!");
      },
    },
  ],
  [
    "setdown",
    {
      name: "setdown",
      alias: ["sd"],
      description: "Sets the down and distance",
      usage: ["setdown 2 15", "sd 4"],
      showCommand: true,
      permissions: {
        level: 1,
        muted: true,
        game: true,
        notDuringPlay: true,
      },
      params: {
        skipMaxCheck: false,
        min: 1,
        max: 2,
        types: [COMMAND_PARAM_TYPES.NUMBER, COMMAND_PARAM_TYPES.NUMBER],
      },
      async run(cmd: CommandMessage) {
        const [down, yardDistance = "USE CURRENT DISTANCE"] =
          cmd.commandParamsArray;

        const downParsed = Math.round(parseInt(down));
        const yardDistanceParsed =
          yardDistance === "USE CURRENT DISTANCE"
            ? Room.game.down.getYardsToGet()
            : Math.round(parseInt(yardDistance));

        if (downParsed > 4 || downParsed < 1)
          throw new CommandError(`Down must be a number between 1 and 4`);

        if (yardDistanceParsed > 99 || yardDistanceParsed < 1)
          throw new CommandError(`Distance must be a number between 1 and 99`);

        Room.game.down.setDown(downParsed as 1 | 2 | 3 | 4);
        Room.game.down.setYardsToGet(yardDistanceParsed);
        Room.game.down.setBallAndFieldMarkersPlayEnd();

        cmd.announce(`Down and Distance updated by ${cmd.author.shortName}`);
        Room.game.down.sendDownAndDistance();
      },
    },
  ],
  [
    "swap",
    {
      name: "swap",
      alias: [],
      description: "Swaps red and blue",
      usage: [],
      showCommand: true,
      permissions: {
        level: 0,
        muted: true,
        game: false,
        notDuringPlay: true,
      },
      params: {
        skipMaxCheck: false,
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        const redPlayers = Room.players.getRed();

        const bluePlayers = Room.players.getBlue();

        redPlayers.forEach((player) => {
          player.setTeam(TEAMS.BLUE);
        });

        bluePlayers.forEach((player) => {
          player.setTeam(TEAMS.RED);
        });

        cmd.announce("Teams swapped");
      },
    },
  ],
  [
    "swapo",
    {
      name: "swapo",
      alias: [],
      description: "Swaps offense and defense",
      usage: [],
      showCommand: true,
      permissions: {
        level: 1,
        muted: false,
        game: false,
        notDuringPlay: true,
      },
      params: {
        skipMaxCheck: false,
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        Room.game.swapOffenseAndUpdatePlayers();
        Room.game.down.setBallAndFieldMarkersPlayEnd();

        const newOffense = Room.game.offenseTeamId;

        const offenseString = getTeamStringFromId(newOffense);

        cmd.announce(
          `Offense swapped by ${cmd.author.shortName}, ${offenseString} is now on offense`
        );
        Room.game.down.sendDownAndDistance();
      },
    },
  ],
  [
    "dd",
    {
      name: "dd",
      alias: [],
      description: "Shows the down and distance",
      usage: [],
      showCommand: true,
      permissions: {
        level: 0,
        muted: true,
        game: true,
        notDuringPlay: false,
      },
      params: {
        skipMaxCheck: false,
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        const downAndDistanceStr = Room.game.down.getDownAndDistanceString();

        cmd.reply(downAndDistanceStr);
      },
    },
  ],
  [
    "release",
    {
      name: "release",
      alias: [],
      description: "Releases the ball",
      usage: [],
      showCommand: true,
      permissions: {
        level: 1,
        muted: true,
        game: true,
        notDuringPlay: false,
      },
      params: {
        skipMaxCheck: false,
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        Ball.release();
        cmd.replySuccess("Ball released");
      },
    },
  ],
  [
    "reset",
    {
      name: "reset",
      alias: [],
      description: "Resets all variables and removes the current play",
      usage: [],
      showCommand: true,
      permissions: {
        level: 1,
        muted: true,
        game: true,
        notDuringPlay: false,
      },
      params: {
        skipMaxCheck: false,
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        Room.game.down.hardReset();
        Chat.sendAnnouncement(`Hard reset ran by ${cmd.author.shortName}`);
      },
    },
  ],
  [
    "flip",
    {
      name: "flip",
      alias: ["coinflip", "cointoss"],
      description: "Flips a coin",
      usage: [],
      showCommand: true,
      permissions: {
        level: 0,
        muted: false,
        game: false,
        notDuringPlay: false,
      },
      params: {
        skipMaxCheck: false,
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        const face = getRandomInt(100) > 50 ? "Heads" : "Tails";
        Chat.sendAnnouncement(`Coin Flip: ${face}`);
      },
    },
  ],
  [
    "status",
    {
      name: "status",
      alias: ["botstatus"],
      description: "Returns the status of the bot, either on or off",
      usage: [],
      showCommand: true,
      permissions: {
        level: 0,
        muted: false,
        game: false,
        notDuringPlay: false,
      },
      params: {
        skipMaxCheck: false,
        min: 0,
        max: 0,
        types: [],
      },
      async run(cmd: CommandMessage) {
        const { isBotOn } = Room;

        if (isBotOn)
          return cmd.reply(`${ICONS.GreenSquare} The Bot is currently ON`);
        cmd.reply(`${ICONS.RedSquare} The Bot is currently OFF`);
      },
    },
  ],
  [
    "bot",
    {
      name: "bot",
      alias: [],
      description: "Turns the bot on or off",
      usage: ["bot on", "bot off"],
      showCommand: true,
      permissions: {
        level: 1,
        muted: false,
        game: false,
        notDuringPlay: false,
      },
      params: {
        skipMaxCheck: false,
        min: 1,
        max: 1,
        types: [["on", "off"]],
      },
      async run(cmd: CommandMessage) {
        const [onOrOff] = cmd.commandParamsArray;

        const { isBotOn } = Room;

        if (onOrOff === "on") {
          if (isBotOn) return cmd.reply("The bot is already ON");

          Room.turnBotOff();
          return cmd.replySuccess("The Bot has been turned ON");
        } else {
          if (!isBotOn) return cmd.reply("The bot is already OFF");

          Room.turnBotOn();
          return cmd.replySuccess("The Bot has been turned OFF");
        }
      },
    },
  ],
  [
    "testingid",
    {
      name: "testingid",
      alias: [],
      description: "Sets the testing ID",
      usage: [],
      showCommand: false,
      permissions: {
        level: 3,
        muted: true,
        game: false,
        notDuringPlay: false,
      },
      params: {
        min: 1,
        max: 1,
        types: [COMMAND_PARAM_TYPES.NUMBER],
      },
      async run(cmd: CommandMessage) {
        console.log(Room);
        Room.setPlayerTestingId(parseInt(cmd.commandParamsStr));
        cmd.replySuccess(`Testing id set`);

        const text = Room.game.playByPlay.map((play) => {
          console.log(play);
          return `${play.playDetails.description}\n`;
        });

        console.log(text);
      },
    },
  ],
]);

export default commandsMap;
