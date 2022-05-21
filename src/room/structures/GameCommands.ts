import Room from "..";
import Player from "../classes/Player";
import Snap from "../plays/Snap";
import Chat from "../roomStructures/Chat";

export interface GameCommandPermissions {
  /**
   * Admin level to use the command
   */
  adminLevel: number;
  /**
   * Can only offense use this command?
   */
  onlyOffense: boolean;

  /**
   * This sets a play, and can only be used when there is no play present
   */
  onlyDuringNoPlay: boolean;
}

export interface GameCommand {
  /**
   * Whether to show the command or not
   */
  showCommand: boolean;
  permissions: GameCommandPermissions;
  run(player: Player): void;
}

const gameCommandsMap = new Map<string, GameCommand>([
  [
    "hike",
    {
      showCommand: true,
      permissions: {
        adminLevel: 0,
        onlyOffense: true,
        onlyDuringNoPlay: true,
      },
      run(player) {
        Room.game.setPlay(
          new Snap(9, player.playerObject!),
          player.playerObject!
        );
      },
    },
  ],
  [
    "fg",
    {
      showCommand: true,
      permissions: {
        adminLevel: 0,
        onlyOffense: true,
        onlyDuringNoPlay: true,
      },
      run(player) {},
    },
  ],
  [
    "punt",
    {
      showCommand: true,
      permissions: {
        adminLevel: 0,
        onlyOffense: true,
        onlyDuringNoPlay: true,
      },
      run(player) {},
    },
  ],
  [
    "2pt",
    {
      showCommand: true,
      permissions: {
        adminLevel: 0,
        onlyOffense: true,
        onlyDuringNoPlay: true,
      },
      run(player) {},
    },
  ],
  [
    "to",
    {
      showCommand: true,
      permissions: {
        adminLevel: 0,
        onlyOffense: true,
        onlyDuringNoPlay: false,
      },
      run() {
        Chat.send(`Timeout called at ${Room.game.getClock()}`);
      },
    },
  ],
]);

export default gameCommandsMap;
