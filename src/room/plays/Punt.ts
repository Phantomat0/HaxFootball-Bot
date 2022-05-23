import Room, { client, TEAMS } from "..";
import BallContact from "../classes/BallContact";
import PlayerContact from "../classes/PlayerContact";
import { PlayableTeamId, Position } from "../HBClient";
import DistanceCalculator from "../structures/DistanceCalculator";
import GameReferee from "../structures/GameReferee";
import MapReferee from "../structures/MapReferee";
import PreSetCalculators from "../structures/PreSetCalculators";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import { MAP_POINTS } from "../utils/map";
import PuntEvents from "./play_events/Punt.events";

export default class Punt extends PuntEvents {
  constructor(time: number) {
    super(time);
  }

  handleTouchdown(position: Position): void {}

  protected _handleBallContactDefense(ballContactObj: BallContact): void {}

  protected _handleBallContactOffense(ballContactObj: BallContact): void {}

  getStartingPosition() {
    return this.getState("catchPosition");
  }

  putOffenseInPosition() {
    const offensePlayers = Room.game.players.getOffense();

    const sevenYardsBehindBall = new DistanceCalculator()
      .subtractByTeam(
        Room.game.down.getSnapPosition().x,
        MAP_POINTS.YARD * 7,
        Room.game.offenseTeamId
      )
      .calculate();

    offensePlayers.forEach((player) => {
      client.setPlayerDiscProperties(player.id, { x: sevenYardsBehindBall });
    });
    return this;
  }

  putDefenseInPosition() {
    const defensePlayers = Room.game.players.getDefense();
    const defenseEndzone = MapReferee.getTeamEndzone(Room.game.defenseTeamId);
    const oneYardInFrontOfEndzone = new DistanceCalculator()
      .subtractByTeam(
        defenseEndzone,
        MAP_POINTS.YARD * 1,
        Room.game.defenseTeamId
      )
      .calculate();

    defensePlayers.forEach((player) => {
      client.setPlayerDiscProperties(player.id, { x: oneYardInFrontOfEndzone });
    });
    return this;
  }

  createInvisibleWallForDefense() {
    const defensePlayers = Room.game.players.getDefense();
    defensePlayers.forEach((player) => {
      const cf = client.CollisionFlags;
      const cfTeam = Room.game.defenseTeamId === TEAMS.RED ? cf.red : cf.blue;
      client.setPlayerDiscProperties(player.id, { cGroup: cfTeam | cf.c0 });
    });
    return this;
  }

  releaseInvisibleWallForDefense() {
    const defensePlayers = Room.game.players.getDefense();
    defensePlayers.forEach((player) => {
      const cf = client.CollisionFlags;
      const cfTeam = Room.game.defenseTeamId === TEAMS.RED ? cf.red : cf.blue;
      client.setPlayerDiscProperties(player.id, { cGroup: cfTeam });
    });
    return this;
  }

  onBallContact(ballContactObj: BallContact) {
    // We have to do this check AGAIN because playerOnkick is not an event listener, but a native listener
    if (this.getState("puntCaught")) return;
    // super.onBallContact(ballContactObj);
  }

  onBallOutOfBounds(ballPosition: Position) {
    const team = Room.game.defenseTeamId;

    const distance = PreSetCalculators.adjustBallPosition(ballPosition, team);

    console.log(distance);

    // sendPlayMessage({
    //   type: PLAY_TYPES.KICK_OUT_OF_BOUNDS,
    //   yard: roundedX.getYardLine(),
    //   position: roundedX.getDistance(),
    // });

    // Check if touchback, cant be a safety

    const isTouchback = GameReferee.checkIfTouchbackBall(ballPosition, team);
    if (isTouchback) return this.handleTouchback();

    // this.endPlay({ endPosition: distance, swapOffense: true });
  }

  onPlayerOutOfBounds(ballCarrierPosition: Position) {
    // const { team, name } = this.getBallCarrier();
    // const { netYards, endPosition, endYard, mapSection } = super.getPlayData(
    //   ballCarrierPosition,
    //   team
    // );
    // sendPlayMessage({
    //   type: PLAY_TYPES.PLYR_OUT_OF_BOUNDS,
    //   playerName: name,
    //   yard: endYard,
    //   netYards: netYards,
    //   position: endPosition,
    // });
    // const isSafety = checkIfSafetyPlayer(ballCarrierPosition, team);
    // if (isSafety) {
    //   const isTouchback = checkIfTouchback(
    //     ballCarrierPosition.x,
    //     this.getState("catchPosition"),
    //     team
    //   );
    //   if (isTouchback) return this.handleTouchback();
    //   return super.handleSafety();
    // }
    // this.endPlay({ endPosition: endPosition });
  }

  handleBallCarrierContactDefense(playerContact: PlayerContact) {
    // const { player, playerPosition, ballCarrierPosition } = contactObj;
    // const { team, name } = this.getBallCarrier();
    // const { netYards, endPosition, endYard, mapSection } = super.getPlayData(
    //   ballCarrierPosition,
    //   team
    // );
    // // Dont check for sacks here
    // sendPlayMessage({
    //   type: PLAY_TYPES.TACKLE,
    //   playerName: name,
    //   player2Name: player.name,
    //   yard: endYard,
    //   netYards: netYards,
    //   mapSection: mapSection,
    //   position: endPosition,
    // });
    // maybeSendQuoteMessage(player.name, netYards);
    // const isSafety = checkIfSafetyPlayer(ballCarrierPosition, team);
    // if (isSafety) {
    //   const isTouchback = checkIfTouchback(
    //     ballCarrierPosition.x,
    //     this.getState("catchPosition"),
    //     team
    //   );
    //   if (isTouchback) return this.handleTouchback();
    //   return super.handleSafety();
    // }
    // this.endPlay({ endPosition: endPosition });
  }

  onKickDrag() {
    // Chat.send("DRAG ON KICK" + dragAmount);
    // const { name } = getClosestPlayerToBall();
    // handlePenalty({ type: PENALTY_TYPES.PUNT_DRAG, playerName: name });
  }

  handleBallDownedByKickingTeam(
    playerPosition: Position,
    teamId: PlayableTeamId
  ) {
    // What if they down in the endzone? ITS A TOUCHBACK THEN
    // sendPlayMessage({
    //   type: PLAY_TYPES.KICK_DOWNED,
    // });
    // const endPositionX = new DistanceCalculator(playerPosition.x)
    //   .roundToYardByTeam(teamId)
    //   .calculate();
    // const adjustedEndPosition = {
    //   x: endPositionX,
    //   y: playerPosition.y,
    // };
    // const isTouchback = GameReferee.checkIfTouchbackPlayer(
    //   adjustedEndPosition,
    //   adjustedEndPosition,
    //   teamId
    // );
    // if (isTouchback) return this.handleTouchback();
    // this.endPlay({ endPosition, swapOffense: true });
  }

  handleCatch(ballContactObj: BallContact) {
    Room.game.swapOffenseAndUpdatePlayers();

    const { player, playerPosition } = ballContactObj;
    const { team } = player;

    const adjustedPlayerPosition =
      PreSetCalculators.adjustPlayerPositionFrontAfterPlay(
        playerPosition,
        team
      );

    this.setState("catchPosition", adjustedPlayerPosition);
    this.setState("puntCaught");

    // sendPlayMessage({
    //   type: PLAY_TYPES.KICK_CATCH,
    //   playerName: name,
    //   yard: adjustedX.getYardLine(),
    //   position: adjustedX.getDistance(),
    // });

    this.setBallCarrier(player);
  }

  private _checkOffsideOffenseAndHandle() {
    // We give some leniancy, 2 yards infront of the LOS

    const team = Room.game.offenseTeamId;

    const threeYardsInFrontOfLOS = new DistanceCalculator()
      .addByTeam(Room.game.down.getLOS().x, MAP_POINTS.YARD * 2, team)
      .calculate();

    const offensePlayers = Room.game.players.getOffense();

    const offsidePlayer =
      offensePlayers.find((player) => {
        const { position } = getPlayerDiscProperties(player.id);
        const { x } = PreSetCalculators.adjustPlayerPositionFront(
          position,
          team
        );
        return !MapReferee.checkIfBehind(x, threeYardsInFrontOfLOS, team);
      }) ?? null;

    console.log(offsidePlayer);

    // if (offsidePlayer)
    // return handlePenalty({
    //   type: PENALTY_TYPES.OFFSIDES_OFFENSE,
    //   playerName: offsidePlayer.name,
    // });
  }

  handleBallContactOffense(ballContactObj: BallContact) {
    const { type, player, playerPosition } = ballContactObj;

    if (type === "touch" && this.stateExists("puntKicked")) return;

    // Initial kick
    if (type === "kick" && this.stateExists("puntKicked")) {
      this.setState("puntKicked");
      this._checkOffsideOffenseAndHandle();
      this.releaseInvisibleWallForDefense();
      return;
    }
    return this.handleBallDownedByKickingTeam(playerPosition, player.team);
  }

  handleBallContactDefense(ballContactObj: BallContact) {
    return this.handleCatch(ballContactObj);
  }

  handleTouchback() {
    // sendPlayMessage({ type: PLAY_TYPES.TOUCHBACK });
    // // Touchbacks can occur without a catch or with a catch, so we have to get the appropriate team
    // const team = this.getState("catchPosition")
    //   ? game.getOffenseTeam()
    //   : game.getDefenseTeam();
    // const offenseEndZone = getTeamEndzone(team);
    // const offenseTwentyYardLine = new DistanceCalculator([
    //   offenseEndZone,
    //   MAP.YARD * 20,
    // ])
    //   .addByTeam(team)
    //   .getDistance();
    // // If the touchback happened and there was a catch, we dont have to swapOffense
    // const shouldSwapOffense = this.getState("catchPosition") ? false : true;
    // this.endPlay({
    //   endPosition: offenseTwentyYardLine,
    //   swapOffense: shouldSwapOffense,
    // });
  }

  endPlay() {
    // // We dont want to swap offense if there is a penalty, or if there is a catch
    // if (swapOffense) {
    //   game.swapOffense();
    // }
    // // Start a new down on catches and when we swap offense
    // if (Boolean(this.getState("catchPosition")) || swapOffense) {
    //   down.startNew();
    // }
    // // We dont adddown on kickoffs or punts
    // super.endPlay({ netYards, endPosition, addDown: false });
  }

  cleanUp(): void {}
}
