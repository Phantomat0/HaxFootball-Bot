import CommandMessage from "../classes/CommandMessage";
import Player, { PlayerAdminLevel } from "../classes/Player";
import Chat from "../roomStructures/Chat";
import Ball from "../roomStructures/Ball";
import PreSetCalculators from "../structures/PreSetCalculators";
import { getTeamStringFromId } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import { getRandomInt } from "../utils/utils";
import { CommandError } from "./CommandHandler";
import Room from "../roomStructures/Room";
import { TEAMS } from "../utils/types";
import client from "..";
import ParamParser, { z } from "./ParamParser";

export type CommandName = string;

export interface Command<T extends any> {
  name: string;
  alias: string[];
  description: string;
  usage: string[];
  showCommand: boolean;
  permissions: CommandPermissions;
  params: T;
  run(obj: {
    cmd: CommandMessage;
    input: {
      [I in keyof T]: T[I] extends ParamParser<unknown, false>
        ? ReturnType<T[I]["parse"]>
        : T[I] extends ParamParser<unknown, true>
        ? ReturnType<T[I]["parse"]>
        : never;
    };
  }): Promise<void>;
}

export interface CommandObj {
  name: string;
  alias: string[];
  description: string;
  usage: string[];
  showCommand: boolean;
  permissions: CommandPermissions;
  params: ParamParser<unknown>[];
  run(obj: { cmd: CommandMessage; input: any[] }): Promise<void>;
}

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

const asCommandArray = <T extends any[]>(
  ...arr: { [I in keyof T]: Command<T[I]> }
) => arr;

const commands = asCommandArray(
  {
    name: "help",
    alias: [],
    description:
      "Returns the list of room commands or returns the description of a given command",
    usage: [],
    showCommand: false,
    permissions: {
      level: 0,
      muted: true,
      game: false,
      notDuringPlay: false,
    },
    params: [z.any("commandName").optional()] as const,
    async run({ cmd, input }) {
      const [commandName] = input;

      if (!commandName) {
        // Output the name of all the commands the player can use
        const commandsAvail = getCommandsAccessibleToPlayer(cmd.author);

        const cmdsAsString: string = commandsAvail
          .map((cmd) => cmd.name)
          .join(", ");

        cmd.reply(`Commands: ${cmdsAsString}`);
        return;
      }

      // Show info about a particular command
      const cmdObj = getCommandByNameOrAlias(commandName);

      if (!cmdObj)
        throw new CommandError(`Command (${commandName}) does not exist`);

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
    params: [] as const,
    async run({ cmd, input }) {
      const commandsAvail = getCommandsAccessibleToPlayer(cmd.author);

      const cmdsAsString: string = commandsAvail
        .map((cmd) => cmd.name)
        .join(", ");

      cmd.reply(`Commands: ${cmdsAsString}`);
    },
  },
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
    params: [] as const,
    async run({ cmd, input }) {
      cmd.reply(
        `setfg | Attempt a Field Goal ${ICONS.SmallBlackSquare} sette | Sets you as the tight end ${ICONS.SmallBlackSquare} setonside | Attempt an onside kick ${ICONS.SmallBlackSquare}\nto | Calls a timeout ${ICONS.SmallBlackSquare} cp | Curved pass ${ICONS.SmallBlackSquare} set2 | Attempt a two point conversion\n!setlos (yard) | Sets the line of scrimmage position\n!setdown (down) (yard) | Sets the down and distance \n!setscore (team) (score) | Sets the score of a team\n!setplayers | Sets the players in front of ball\n!dd | Returns the down and distance \n!swapo | Swaps offense and defense`
      );
    },
  },
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
    params: [] as const,
    async run({ cmd, input }) {
      cmd.reply(
        `Rules of the game\n${ICONS.SmallBlackSquare} Offense | One player is a passer, while the rest of the team runs to get open for a catch. Catch the ball by touching it after a pass and run to the opposing team's goal.\n${ICONS.SmallBlackSquare} Defense | Guard the receivers and prevent them from catching the ball. Defense has to be behind the blue line at all times.`
      );
    },
  },
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
    async run({ cmd, input }) {
      cmd.announce(
        `You cannot stand in front of the blue line for more than 3 seconds without an offensive player being present.`
      );
    },
  },
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
    params: [z.player().optional()] as const,
    async run({ cmd, input }) {
      if (Room.game === null) throw new CommandError("No game in progress");

      const [player] = input;

      // If no params get the stats of the player using the command
      if (!player) {
        const playerRecord = Room.game.players.records.findOne({
          auth: cmd.author.auth,
        });

        const playerStats = Room.game.stats.statsCollection.get(
          playerRecord?.recordId ?? 0
        );

        if (!playerRecord || !playerStats)
          throw new CommandError(`You do not have any stats yet`);

        const playerStatsString = playerStats.getStatsStringNormal();

        cmd.reply(`${playerStatsString}`, {
          autoSize: false,
        });
        return;
      }

      const playerRecord = Room.game.players.records.findOne({
        auth: player.auth,
      });

      const playersStatProfile = Room.game.stats.statsCollection.get(
        playerRecord?.recordId ?? 0
      );

      if (!playersStatProfile || !playerRecord)
        throw new CommandError(
          `Player ${player.shortName} does not have any stats yet`
        );

      const playerStats = playersStatProfile.getStatsStringNormal();

      cmd.reply(`Stats ${player.shortName}\n${playerStats}`, {
        autoSize: false,
      });
    },
  },
  {
    name: "score",
    alias: ["sc"],
    description: "Returns the score of the current game",
    usage: [],
    showCommand: false,
    permissions: {
      level: 0,
      muted: true,
      game: true,
      notDuringPlay: false,
    },
    params: [] as const,
    async run({ cmd, input }) {
      const scoreboardStr = Room.game.getScoreBoardStr();
      cmd.reply(scoreboardStr);
    },
  },
  {
    name: "setscore",
    alias: ["ss"],
    description: "Sets the score for a team",
    usage: ["setscore blue 7", "ss r 10"],
    showCommand: true,
    permissions: {
      level: 1,
      muted: true,
      game: true,
      notDuringPlay: false,
    },
    params: [z.team(), z.integer("Score").positive().max(100)] as const,
    async run({ cmd, input }) {
      const [team, score] = input;

      Room.game.setScore(team.id, score);

      cmd.announce(
        `Score updated [${team.name.toUpperCase()}] by ${cmd.author.shortName}`
      );
      Room.game.sendScoreBoard();
    },
  },
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
    params: [z.team(), z.integer("Yardage").min(1).max(50)] as const,
    async run({ cmd, input }) {
      const [team, yardage] = input;

      const yardAsDistance = PreSetCalculators.getPositionOfTeamYard(
        yardage,
        team.id
      );

      Room.game.down.setLOS(yardAsDistance);
      Room.game.down.setBallAndFieldMarkersPlayEnd();
      Room.game.down.hardSetPlayers();

      cmd.announce(`LOS moved by ${cmd.author.shortName}`);
      Room.game.down.sendDownAndDistance();
    },
  },
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
    params: [] as const,
    async run({ cmd, input }) {
      const { down, losX, yardsToGet } = Room.game.down.previousDown;

      Room.game.down.setDown(down);
      Room.game.down.setYardsToGet(yardsToGet);

      Room.game.down.setLOS(losX);
      Room.game.down.setBallAndFieldMarkersPlayEnd();
      Room.game.down.hardSetPlayers();

      cmd.announce(`Play reverted by ${cmd.author.shortName}`);
      Room.game.down.sendDownAndDistance();
    },
  },
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
    params: [] as const,
    async run({ cmd, input }) {
      Room.game.down.hardSetPlayers();
      cmd.replySuccess("Players set!");
    },
  },
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
    params: [
      z.integer("Down").min(1).max(4),
      z.integer("Distance").min(1).max(99).optional(),
    ] as const,
    async run({ cmd, input }) {
      const [down, yardDistance] = input;

      // If yard distance is supplied, use it, otherwise use the current yards to get
      const yardDistanceParsed = yardDistance
        ? yardDistance
        : Room.game.down.getYardsToGet();

      Room.game.down.setDown(down as 1 | 2 | 3 | 4);
      Room.game.down.setYardsToGet(yardDistanceParsed);
      Room.game.down.setBallAndFieldMarkersPlayEnd();

      cmd.announce(`Down and Distance updated by ${cmd.author.shortName}`);
      Room.game.down.sendDownAndDistance();
    },
  },
  {
    name: "swap",
    alias: [],
    description: "Swaps red and blue",
    usage: [],
    showCommand: true,
    permissions: {
      level: 1,
      muted: true,
      game: false,
      notDuringPlay: true,
    },
    params: [] as const,
    async run({ cmd, input }) {
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
    params: [] as const,
    async run({ cmd, input }) {
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
    params: [] as const,
    async run({ cmd, input }) {
      const downAndDistanceStr = Room.game.down.getDownAndDistanceString();

      cmd.reply(downAndDistanceStr);
    },
  },
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
    params: [] as const,
    async run({ cmd, input }) {
      Ball.release();
      cmd.replySuccess("Ball released");
    },
  },
  {
    name: "mute",
    alias: ["m"],
    description: "Mutes a player",
    usage: ["mute [name]"],
    showCommand: true,
    permissions: {
      level: 1,
      muted: true,
      game: false,
      notDuringPlay: false,
    },
    params: [z.player()] as const,
    async run({ cmd, input }) {
      const [player] = input;

      if (player.isMuted)
        throw new CommandError(`${player.shortName} is already muted`);

      if (!cmd.author.canModerate(player))
        throw new CommandError("You cannot mute an admin");

      Room.players.muted.addMute(player);

      cmd.announce(
        `${player.shortName} has been muted by ${cmd.author.shortName}`,
        { icon: ICONS.Mute }
      );
    },
  },
  {
    name: "unmute",
    alias: ["um"],
    description: "Unmutes a player",
    usage: ["unmute [name]"],
    showCommand: true,
    permissions: {
      level: 1,
      muted: true,
      game: false,
      notDuringPlay: false,
    },
    params: [z.player()] as const,
    async run({ cmd, input }) {
      const [player] = input;

      if (player.isMuted === false)
        throw new CommandError(`Player ${player.shortName} is not muted`);

      Room.players.muted.removeMute(player.auth);

      cmd.announce(`${player.shortName} has been unmuted`);
    },
  },
  {
    name: "silence",
    alias: [],
    description: "Mutes messages from non admins, does not effect team chat",
    usage: [],
    showCommand: true,
    permissions: {
      level: 1,
      muted: false,
      game: false,
      notDuringPlay: false,
    },
    params: [] as const,
    async run({ cmd, input }) {
      if (Chat.silenced) throw new CommandError("The chat is already silenced");
      Chat.silenced = true;

      cmd.announce("The chat has been silenced");
    },
  },
  {
    name: "unsilence",
    alias: [],
    description: "Removes the silence from the chat",
    usage: [],
    showCommand: true,
    permissions: {
      level: 1,
      muted: false,
      game: false,
      notDuringPlay: false,
    },
    params: [] as const,
    async run({ cmd, input }) {
      if (Chat.silenced!)
        throw new CommandError("The chat is not currently silenced");
      Chat.silenced = false;

      cmd.announce("The chat has been un-silenced");
    },
  },
  {
    name: "muted",
    alias: [],
    description: "Returns all the muted players currently in the room",
    usage: [],
    showCommand: false,
    permissions: {
      level: 0,
      muted: true,
      game: false,
      notDuringPlay: false,
    },
    params: [] as const,
    async run({ cmd, input }) {
      // Only show the muted players currently in the room
      const mutedPlayers = Room.players.muted.mutedCollection.find();
      // .filter(({ id }) => Room.players.has(id));

      if (mutedPlayers.length === 0)
        throw new CommandError("There are no muted players");

      const mutedPlayersStr: string = mutedPlayers
        .map(({ name }) => `${name}`)
        .join(", ");

      cmd.reply(`Muted: ${mutedPlayersStr}`);
    },
  },
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
    params: [] as const,
    async run({ cmd, input }) {
      Room.game.down.hardReset();
      Chat.sendAnnouncement(`Manual reset by ${cmd.author.shortName}`);
    },
  },
  {
    name: "discord",
    alias: [],
    description: "Returns the community discord link",
    usage: [],
    showCommand: false,
    permissions: {
      level: 0,
      muted: false,
      game: false,
      notDuringPlay: false,
    },
    params: [] as const,
    async run({ cmd, input }) {
      cmd.reply("Discord: discord.gg/VdrD2p7");
    },
  },
  {
    name: "flip",
    alias: ["coinflip", "cointoss"],
    description: "Flips a coin",
    usage: [],
    showCommand: true,
    permissions: {
      level: 1,
      muted: false,
      game: false,
      notDuringPlay: false,
    },
    params: [] as const,
    async run({ cmd, input }) {
      const face = getRandomInt(100) > 50 ? "Heads" : "Tails";
      Chat.sendAnnouncement(`Coin Flip: ${face}`);
    },
  },
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
    params: [] as const,
    async run({ cmd, input }) {
      const { isBotOn } = Room;

      if (isBotOn)
        return cmd.reply(`${ICONS.GreenSquare} The Bot is currently ON`);
      cmd.reply(`${ICONS.RedSquare} The Bot is currently OFF`);
    },
  },
  {
    name: "clearbans",
    alias: [],
    description: "Clears bans",
    usage: [],
    showCommand: true,
    permissions: {
      level: 1,
      muted: false,
      game: false,
      notDuringPlay: false,
    },
    params: [] as const,
    async run({ cmd, input }) {
      client.clearBans();
      cmd.replySuccess("Bans have been cleared!");
    },
  },
  {
    name: "admin",
    alias: [],
    description: "Sets the player as a Bot Admin using an admin code",
    usage: ["admin [code]"],
    showCommand: false,
    permissions: {
      level: 0,
      muted: true,
      game: false,
      notDuringPlay: false,
    },
    params: [z.any()] as const,
    async run({ cmd, input }) {
      const [adminCode] = input;

      if (adminCode !== Room.sessionId)
        throw new CommandError("Invalid Admin Code");

      cmd.author.setAdminLevel(3).setAdmin(true);
      cmd.replySuccess(`You are now the Bot Admin`, { color: 0xffd726 });
    },
  }
);

export function getCommandsAccessibleToPlayer(player: Player) {
  return commands.filter((cmd) => cmd.permissions.level <= player.adminLevel);
}

export function getCommandByNameOrAlias(cmdName: string) {
  const commandByName = commands.find((cmd) => cmd.name === cmdName);

  const commandByAlias = commands.find((cmd) => cmd.alias.includes(cmdName));

  return commandByName ?? commandByAlias ?? null;
}

export default commands;
