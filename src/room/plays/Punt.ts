import Room, { client, TEAMS } from "..";
import { Position } from "../HBClient";
import DistanceCalculator from "../structures/DistanceCalculator";
import MapReferee from "../structures/MapReferee";
import PreSetCalculators from "../structures/PreSetCalculators";
import { MAP_POINTS } from "../utils/map";
import BasePlay from "./BasePlay";

type PUNT_PLAY_STATES = "punt" | "puntCaught" | "catchPosition";

class Punt extends BasePlay<PUNT_PLAY_STATES> {
  constructor(time: number) {
    super(time);
  }

  getStartingPosition() {
    return this.readState("catchPosition");
  }

  putOffenseInPosition() {
    const { offensePlayers } = game.getOffenseDefensePlayers();

    const sevenYardsBehindBall = new DistanceCalculator()
      .subtractByTeam(
        down.getSnapDistance(),
        MAP_POINTS.YARD * 7,
        game.getOffenseTeam()
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

  onBallContact(ballContactObj) {
    // We have to do this check AGAIN because playerOnkick is not an event listener, but a native listener
    if (this.readState("puntCaught")) return;
    super.onBallContact(ballContactObj);
  }

  onBallOutOfBounds(ballPosition: Position) {
    const { x } = ballPosition;
    const team = game.getDefenseTeam();

    const distance = PreSetCalculators.adjustBallPosition(x, team);

    sendPlayMessage({
      type: PLAY_TYPES.KICK_OUT_OF_BOUNDS,
      yard: roundedX.getYardLine(),
      position: roundedX.getDistance(),
    });

    // Check if touchback, cant be a safety

    const isTouchback = MapReferee.checkIfTouchbackBall(x, team);
    if (isTouchback) return this.handleTouchback();

    this.endPlay({ endPosition: distance, swapOffense: true });
  }

  onPlayerOutOfBounds(ballCarrierPosition) {
    const { team, name } = this.getBallCarrier();

    const { netYards, endPosition, endYard, mapSection } = super.getPlayData(
      ballCarrierPosition,
      team
    );

    sendPlayMessage({
      type: PLAY_TYPES.PLYR_OUT_OF_BOUNDS,
      playerName: name,
      yard: endYard,
      netYards: netYards,
      position: endPosition,
    });

    const isSafety = checkIfSafetyPlayer(ballCarrierPosition, team);

    if (isSafety) {
      const isTouchback = checkIfTouchback(
        ballCarrierPosition.x,
        this.getState("catchPosition"),
        team
      );
      if (isTouchback) return this.handleTouchback();
      return super.handleSafety();
    }
    this.endPlay({ endPosition: endPosition });
  }

  onPlayerContactDefense(contactObj) {
    const { player, playerPosition, ballCarrierPosition } = contactObj;
    const { team, name } = this.getBallCarrier();

    const { netYards, endPosition, endYard, mapSection } = super.getPlayData(
      ballCarrierPosition,
      team
    );

    // Dont check for sacks here

    sendPlayMessage({
      type: PLAY_TYPES.TACKLE,
      playerName: name,
      player2Name: player.name,
      yard: endYard,
      netYards: netYards,
      mapSection: mapSection,
      position: endPosition,
    });

    maybeSendQuoteMessage(player.name, netYards);

    const isSafety = checkIfSafetyPlayer(ballCarrierPosition, team);

    if (isSafety) {
      const isTouchback = checkIfTouchback(
        ballCarrierPosition.x,
        this.getState("catchPosition"),
        team
      );
      if (isTouchback) return this.handleTouchback();
      return super.handleSafety();
    }

    this.endPlay({ endPosition: endPosition });
  }

  onKickDrag(dragAmount) {
    Chat.send("DRAG ON KICK" + dragAmount);

    const { name } = getClosestPlayerToBall();

    handlePenalty({ type: PENALTY_TYPES.PUNT_DRAG, playerName: name });
  }

  handleBallDownedByKickingTeam(playerPosition, playerTeam) {
    // What if they down in the endzone? ITS A TOUCHBACK THEN

    sendPlayMessage({
      type: PLAY_TYPES.KICK_DOWNED,
    });

    const endPosition = new DistanceCalculator(playerPosition.x)
      .roundByTeam(playerTeam)
      .getDistance();

    const isTouchback = checkIfTouchback(x, null, team);
    if (isTouchback) return this.handleTouchback();

    this.endPlay({ endPosition, swapOffense: true });
  }

  handleCatch(ballContactObj) {
    game.swapOffense();

    const {
      player,
      playerPosition: { x },
    } = ballContactObj;
    const { name, team } = player;

    const adjustedX = new DistanceCalculator([x, MAP.PLAYER_RADIUS])
      .addByTeam(team)
      .roundByTeam()
      .roundToMap();

    this.setState("catchPosition", adjustedX.getDistance());
    this.setState("puntCaught");

    sendPlayMessage({
      type: PLAY_TYPES.KICK_CATCH,
      playerName: name,
      yard: adjustedX.getYardLine(),
      position: adjustedX.getDistance(),
    });

    this.setBallCarrier(player);
  }

  #checkOffsideOffenseAndHandle() {
    // We give some leniancy, 2 yards infront of the LOS

    const team = game.getOffenseTeam();

    const threeYardsInFrontOfLOS = new DistanceCalculator([
      down.getLOS(),
      MAP.YARD * 2,
    ])
      .addByTeam(team)
      .getDistance();

    const { offensePlayers } = game.getOffenseDefensePlayers();

    const offsidePlayer =
      offensePlayers.find((player) => {
        const { x } = DistanceCalculator.adjustPlayerPosition(player);
        return !checkIfBehind(x, threeYardsInFrontOfLOS, team);
      }) ?? null;

    if (offsidePlayer)
      return handlePenalty({
        type: PENALTY_TYPES.OFFSIDES_OFFENSE,
        playerName: offsidePlayer.name,
      });
  }

  handleBallContactOffense(ballContactObj) {
    const { type, player, playerPosition } = ballContactObj;

    if (
      type === BALL_CONTACT_TYPES.TOUCH &&
      this.getState("puntKicked") === false
    )
      return;

    // Initial kick
    if (
      type === BALL_CONTACT_TYPES.KICK &&
      this.getState("puntKicked") === false
    ) {
      this.setState("puntKicked");
      this.#checkOffsideOffenseAndHandle();
      this.releaseInvisibleWallForDefense();
      return;
    }
    return this.handleBallDownedByKickingTeam(playerPosition);
  }

  handleBallContactDefense(ballContactObj) {
    return this.handleCatch(ballContactObj);
  }

  handleTouchback() {
    sendPlayMessage({ type: PLAY_TYPES.TOUCHBACK });

    // Touchbacks can occur without a catch or with a catch, so we have to get the appropriate team
    const team = this.getState("catchPosition")
      ? game.getOffenseTeam()
      : game.getDefenseTeam();

    const offenseEndZone = getTeamEndzone(team);

    const offenseTwentyYardLine = new DistanceCalculator([
      offenseEndZone,
      MAP.YARD * 20,
    ])
      .addByTeam(team)
      .getDistance();

    // If the touchback happened and there was a catch, we dont have to swapOffense
    const shouldSwapOffense = this.getState("catchPosition") ? false : true;

    this.endPlay({
      endPosition: offenseTwentyYardLine,
      swapOffense: shouldSwapOffense,
    });
  }

  endPlay({ netYards = 0, endPosition, swapOffense = false }) {
    // We dont want to swap offense if there is a penalty, or if there is a catch
    if (swapOffense) {
      game.swapOffense();
    }

    // Start a new down on catches and when we swap offense
    if (Boolean(this.getState("catchPosition")) || swapOffense) {
      down.startNew();
    }

    // We dont adddown on kickoffs or punts
    super.endPlay({ netYards, endPosition, addDown: false });
  }
}
