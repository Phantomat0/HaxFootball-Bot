import Room from "..";
import BallContact from "../classes/BallContact";
import { Position } from "../HBClient";
import Chat from "../roomStructures/Chat";
import DistanceCalculator from "../structures/DistanceCalculator";
import GameReferee from "../structures/GameReferee";
import MapReferee from "../structures/MapReferee";
import PreSetCalculators from "../structures/PreSetCalculators";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import ICONS from "../utils/Icons";
import { MAP_POINTS } from "../utils/map";
import KickOffEvents from "./play_events/KickOff.events";

export default class KickOff extends KickOffEvents {
  handleTouchdown(endPosition: Position): void {
    super.handleTouchdown(endPosition);
  }

  protected _handleBallContactDefense(ballContactObj: BallContact): void {
    const { yardAndHalfStr, endPosition } = this._getPlayDataOffense(
      ballContactObj.playerPosition
    );

    // Ball downed by own team
    Chat.send(`${ICONS.Pushpin} Ball downed by defense ${yardAndHalfStr}`);

    // Check where the ball was downed at
    // The catch position is the same as the endzone position
    // Adjust it for defense, since they are the ones making contact
    const { isTouchback } = GameReferee.checkIfSafetyOrTouchbackPlayer(
      ballContactObj.playerPosition,
      ballContactObj.playerPosition,
      Room.game.offenseTeamId
    );

    if (isTouchback) return this.handleTouchback();

    this.endPlay({ newLosX: endPosition.x, resetDown: true });
  }

  private _checkIfOffenseOffsidesOnKick() {
    const losX = Room.game.down.getLOS().x;

    const twoYardsInFrontOfLos = new DistanceCalculator()
      .addByTeam(losX, MAP_POINTS.YARD * 2, Room.game.offenseTeamId)
      .calculate();

    const offensePlayers = Room.game.players.getOffense();

    // Find a player that is offsides

    const offSidePlayer = offensePlayers.find((player) => {
      const { position } = getPlayerDiscProperties(player.id);

      const isOnside = MapReferee.checkIfBehind(
        position.x,
        twoYardsInFrontOfLos,
        Room.game.offenseTeamId
      );

      return isOnside === false;
    });

    const offsidePlayerExists = Boolean(offSidePlayer);

    return {
      isOffsides: offsidePlayerExists,
      offsidesPlayer: offSidePlayer,
    };
  }

  protected _handleBallContactOffense(ballContactObj: BallContact): void {
    // We have to know if it was kicked off first
    // Kicking team starts off as offense, switched to defense moment the ball is kicked

    // Kicking team touches
    if (this.stateExists("kickOffKicked") === false) {
      if (ballContactObj.type === "kick") {
        this.setState("kickOffKicked");
        this.setState("KickOffKicker", ballContactObj.player);

        // Before we swap, check for the penalty

        const { isOffsides, offsidesPlayer } =
          this._checkIfOffenseOffsidesOnKick();

        if (isOffsides) {
          // We have to check if its a safety or not

          const isSafetyKickoff = Room.game.stateExists("safetyKickoff");

          if (isSafetyKickoff)
            return this._handlePenalty(
              "kickOffOffsidesSafety",
              offsidesPlayer!
            );

          return this._handlePenalty("kickOffOffsides", offsidesPlayer!);
        }

        Room.game.swapOffenseAndUpdatePlayers();
      }

      return;
    }

    // Receiving team touches
    this.handleCatch(ballContactObj);
  }

  handleCatch(ballContactObj: BallContact) {
    Chat.send(`${ICONS.Football} Ball Caught`);
    this.setState("kickOffCaught");

    // Adjust the position and set it

    const catchPosition = PreSetCalculators.adjustPlayerPositionFront(
      ballContactObj.playerPosition,
      Room.game.offenseTeamId
    );

    this.setState("catchPosition", catchPosition);
    this._setStartingPosition(catchPosition);

    // Check if caught out of bounds
    const isOutOfBounds = MapReferee.checkIfPlayerOutOfBounds(
      ballContactObj.playerPosition
    );

    const frontPlayerPosition =
      PreSetCalculators.adjustPlayerPositionFrontAfterPlay(
        ballContactObj.playerPosition,
        ballContactObj.player.team
      );

    if (isOutOfBounds) {
      Chat.send(`${ICONS.Pushpin} Caught out of bounds`);
      return this.endPlay({ newLosX: frontPlayerPosition.x, resetDown: true });
    }

    this._setStartingPosition(frontPlayerPosition);
    this.setBallCarrier(ballContactObj.player);
  }

  cleanUp(): void {}

  // positionBallAndFieldMarkers() {
  //   // No snap distance for kickoffs, we always place on the LOS
  //   ball.setPosition({ x: down.getLOS() });
  //   ball.release();
  //   down.moveFieldMarkers();
  //   return this;
  // }
  // #checkOffsideOffenseAndHandle() {
  //   // We give some leniancy, 2 yards infront of the LOS
  //   const team = game.getOffenseTeam();
  //   const threeYardsInFrontOfLOS = new DistanceCalculator([
  //     down.getLOS(),
  //     MAP.YARD * 2,
  //   ])
  //     .addByTeam(team)
  //     .getDistance();
  //   const { offensePlayers } = game.getOffenseDefensePlayers();
  //   const offsidePlayer =
  //     offensePlayers.find((player) => {
  //       const { x } = DistanceCalculator.adjustPlayerPosition(player);
  //       return !checkIfBehind(x, threeYardsInFrontOfLOS, team);
  //     }) ?? null;
  //   if (offsidePlayer) {
  //     // Which forty yard line depends on if its a safety
  //     const team = down.getState("safetyKickOff")
  //       ? game.getOffenseTeam()
  //       : game.getDefenseTeam();
  //     const offenseOrDefenseEndZone = getTeamEndzone(team);
  //     const offenseOrDefenseFortyYardLine = new DistanceCalculator([
  //       offenseOrDefenseEndZone,
  //       MAP.YARD * 40,
  //     ])
  //       .addByTeam(team)
  //       .getDistance();
  //     handlePenalty({
  //       type: down.getState("safetyKickOff")
  //         ? PENALTY_TYPES.KICKOFF_OFFSIDES_SAFETY
  //         : PENALTY_TYPES.KICKOFF_OFFSIDES,
  //       playerName: offsidePlayer.name,
  //     });
  //     this.endPlay({
  //       endPosition: offenseOrDefenseFortyYardLine,
  //       swapOffense: true,
  //     });
  //   }
  // }
  // handleBallContactOffense(ballContactObj) {
  //   const { type, player, playerPosition } = ballContactObj;
  //   if (
  //     type === BALL_CONTACT_TYPES.TOUCH &&
  //     this.getState("kickOffKicked") === false
  //   )
  //     return;
  //   // Initial kick
  //   if (
  //     type === BALL_CONTACT_TYPES.KICK &&
  //     this.getState("kickOffKicked") === false
  //   ) {
  //     this.setState("kickOffKicked");
  //     this.#checkOffsideOffenseAndHandle();
  //     return;
  //     // We dont have to release invisible walls since its already done natively
  //   }
  //   return super.handleBallDownedByKickingTeam(playerPosition);
  // }
}
