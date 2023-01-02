import Player from "../classes/Player";
import { PlayableTeamId } from "../HBClient";
import FieldGoal from "../plays/FieldGoal";
import KickOff from "../plays/Kickoff";
import OnsideKick from "../plays/OnsideKick";
import Punt from "../plays/Punt";
import Snap from "../plays/Snap";
import Ball from "../roomStructures/Ball";
import Chat from "../roomStructures/Chat";
import Room from "../roomStructures/Room";
import PreSetCalculators from "../structures/PreSetCalculators";
import COLORS from "../utils/colors";
import { quickPause } from "../utils/haxUtils";
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

  /**
   * Can run in the time between a score and the ball being scored in the goal
   */
  canRunDuringBallScore?: boolean;
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
          new Snap(Room.game.getTimeRounded(), player.playerObject!),
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
        const offensePlayers = Room.game.players.getOffense();

        const isAlreadyCurvePass = Room.game.stateExists("curvePass");

        if (isAlreadyCurvePass) {
          Room.game.deleteState("curvePass");

          // Inform team members of the command
          offensePlayers.forEach((teamPlayer) => {
            Chat.send(`${ICONS.Frisbee} Curve pass disabled`, {
              id: teamPlayer.id,
              color: COLORS.Gray,
            });
          });
          return;
        }
        Room.game.setState("curvePass");

        // Inform team members of the command
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
    "sette",
    {
      showCommand: false,
      permissions: {
        adminLevel: 0,
        onlyOffense: true,
        onlyDuringNoPlay: true,
        canRunDuringTwoPointAttempt: true,
      },
      run(player) {
        // VALIDATION
        const tightEndId = Room.game.getTightEnd();

        const existsAlreadyTightEnd = tightEndId !== null;

        if (existsAlreadyTightEnd) {
          // TE player is using TE command, that means remove his TE
          if (tightEndId === player.id) {
            Room.game.setTightEnd(null);
            Chat.send(`You are no longer the Tight End`, {
              color: COLORS.Gray,
              id: player.id,
            });
            return;
          }

          // Otherwise, inform them there can only be one TE per team
          const tightEndProfile = Room.players.playerCollection.get(tightEndId);

          if (!tightEndProfile) throw Error("Could not find tight end profile");

          throw new GameCommandError(
            `${tightEndProfile.shortName} is already the Tight End`,
            true
          );
        }

        Room.game.setTightEnd(player.id);

        // We probs should inform all the team members
        const offensePlayers = Room.game.players.getOffense();
        offensePlayers.forEach((teamPlayer) => {
          Chat.send(`${ICONS.Lightning} ${player.shortName} is the Tight End`, {
            id: teamPlayer.id,
            color: COLORS.Gray,
          });
        });
      },
    },
  ],
  [
    "setfg",
    {
      showCommand: true,
      permissions: {
        adminLevel: 0,
        onlyOffense: true,
        onlyDuringNoPlay: true,
      },
      run(player) {
        Room.game.setPlay(
          new FieldGoal(Room.game.getTimeRounded(), player.playerObject!),
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
          new Punt(Room.game.getTimeRounded(), player.playerObject!),
          player.playerObject!
        );
      },
    },
  ],
  [
    "set2",
    {
      showCommand: true,
      permissions: {
        adminLevel: 0,
        onlyOffense: true,
        onlyDuringNoPlay: true,
        canRunDuringTwoPointAttempt: true,
        canRunDuringBallScore: true,
      },
      run(player) {
        const canTwoPoint = Room.game.stateExists("canTwoPoint");

        if (!canTwoPoint)
          throw new GameCommandError(
            `You can only attempt a two point conversion after a touchdown`,
            true
          );

        const isAlreadyTwoPointAttempt =
          Room.game.stateExists("twoPointAttempt");

        if (isAlreadyTwoPointAttempt)
          throw new GameCommandError(
            `There is already a two point attempt in progress`,
            true
          );

        Room.game.deleteState("ballBeingScored");
        Room.game.setState("twoPointAttempt");

        Chat.send(`${ICONS.BrownCircle} Two Point Attempt!`);

        const THREE_POINT_ATTEMPT_YARD_LINE: number = 3;

        /**
         * Set the LOS at the defensive team's 2 yard line
         */
        const defensiveThreeYardLine = PreSetCalculators.getPositionOfTeamYard(
          THREE_POINT_ATTEMPT_YARD_LINE,
          Room.game.defenseTeamId
        );

        Room.game.down.setLOS(defensiveThreeYardLine);
        Room.game.down.setYardsToGet(THREE_POINT_ATTEMPT_YARD_LINE);
        Room.game.down.moveFieldMarkers();
        Room.game.startSnapDelay();
        Room.game.down.setPlayers();
        Ball.setPosition(Room.game.down.getSnapPosition());
        Ball.setGravity({ y: 0 });
        quickPause();
      },
    },
  ],
  [
    "setonside",
    {
      showCommand: true,
      permissions: {
        adminLevel: 0,
        onlyOffense: true,
        onlyDuringNoPlay: false,
        canRunDuringTwoPointAttempt: false,
      },
      run(player) {
        const isPlay = Room.game.play !== null;

        if (!isPlay)
          throw new GameCommandError(
            "An onside kick can only be performed during a kickoff",
            true
          );

        const isKickOff = Room.getPlay().stateExistsUnsafe("kickOff");

        if (!isKickOff)
          throw new GameCommandError(
            "An onside kick can only be performed during a kickoff",
            true
          );

        const { canOnside, reason } =
          Room.getPlay<KickOff>().checkIfCanOnside();

        if (canOnside === false) throw new GameCommandError(reason!, true);

        Room.game.setPlay(
          new OnsideKick(Room.game.getTimeRounded(), player.playerObject!),
          player.playerObject!
        );
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
        Room.game.addTeamTimeOut(player.team as PlayableTeamId);

        const teamTimeouts = Room.game.timeOuts.filter(
          (timeout) => timeout.team === player.team
        );

        Chat.send(
          `Timeout called at ${Room.game.getClock()} | Used Teams Timeouts: ${
            teamTimeouts.length
          }`
        );
      },
    },
  ],
]);

export default gameCommandsMap;
