import Room, { TEAMS } from "..";
import Player from "../classes/Player";
import { PlayableTeamId } from "../HBClient";
import FieldGoal from "../plays/FieldGoal";
import Punt from "../plays/Punt";
import Snap from "../plays/Snap";
import Ball from "../roomStructures/Ball";
import Chat from "../roomStructures/Chat";
import PreSetCalculators from "../structures/PreSetCalculators";
import COLORS from "../utils/colors";
import ICONS from "../utils/Icons";
import { GameCommandError } from "./GameCommandHandler";

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

  /**
   * Can run this when a two point attempt is possible
   */
  canRunDuringTwoPointAttempt?: boolean;
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
        canRunDuringTwoPointAttempt: true,
      },
      run(player) {
        Room.game.setPlay(
          new Snap(Room.game.getTime(), player.playerObject!),
          player.playerObject!
        );
      },
    },
  ],
  [
    "cp",
    {
      showCommand: false,
      permissions: {
        adminLevel: 0,
        onlyOffense: true,
        onlyDuringNoPlay: true,
        canRunDuringTwoPointAttempt: true,
      },
      run(player) {
        Room.game.setState("curvePass");
        // We probs should inform all the team members

        const offensePlayers =
          Room.game.offenseTeamId === TEAMS.RED
            ? Room.players.getRed()
            : Room.players.getBlue();

        offensePlayers.forEach((teamPlayer) => {
          Chat.send(`${ICONS.Frisbee} Curve pass enabled`, {
            id: teamPlayer.id,
            color: COLORS.Gray,
          });
        });
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
      run(player) {
        Room.game.setPlay(
          new FieldGoal(Room.game.getTime(), player.playerObject!),
          player.playerObject!
        );
      },
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
      run(player) {
        Room.game.setPlay(
          new Punt(Room.game.getTime(), player.playerObject!),
          player.playerObject!
        );
      },
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
        canRunDuringTwoPointAttempt: true,
      },
      run(player) {
        const canTwoPoint = Room.game.stateExists("canTwoPoint");

        if (!canTwoPoint)
          throw new GameCommandError(
            `You can only attempt a two point conversion after a touchdown`
          );

        const isAlreadyTwoPointAttempt =
          Room.game.stateExists("twoPointAttempt");

        if (isAlreadyTwoPointAttempt)
          throw new GameCommandError(
            `There is already a two point attempt in progress`
          );
        Room.game.setState("twoPointAttempt");

        Chat.send(`${ICONS.BrownCircle} Two Point Attempt!`);

        const TWO_POINT_ATTEMPT_YARD_LINE: number = 3;

        /**
         * Set the LOS at the defensive team's 2 yard line
         */
        const defensiveTwoYardLine = PreSetCalculators.getPositionOfTeamYard(
          TWO_POINT_ATTEMPT_YARD_LINE,
          Room.game.defenseTeamId
        );

        Room.game.down.setLOS(defensiveTwoYardLine);
        Room.game.down.setYardsToGet(TWO_POINT_ATTEMPT_YARD_LINE);
        Room.game.down.moveFieldMarkers();
        Room.game.startSnapDelay();
        Room.game.down.hardSetPlayers();
        Ball.setPosition(Room.game.down.getSnapPosition());
        Ball.setGravity({ y: 0 });
        //
      },
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
        canRunDuringTwoPointAttempt: true,
      },
      run(player) {
        // Increment team timeout
        Room.game.incrementTeamTimeout(player.team as PlayableTeamId);

        const teamTimeouts =
          player.team === TEAMS.RED
            ? Room.game.timeoutsUsed.red
            : Room.game.timeoutsUsed.blue;

        Chat.send(
          `Timeout called at ${Room.game.getClock()} | Used Teams Timeouts: ${teamTimeouts}`
        );
      },
    },
  ],
]);

export default gameCommandsMap;
