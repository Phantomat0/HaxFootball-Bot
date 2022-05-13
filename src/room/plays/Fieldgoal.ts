import { Position } from "../HBClient";
import FieldGoalEvents from "./play_events/FieldGoal.events";

export default class FieldGoal extends FieldGoalEvents {
  handleTouchdown(position: Position): void {}
  // _kicker: PlayerObject;
  // constructor(time: number, kicker: PlayerObject) {
  //   super(time);
  //   this._kicker = kicker;
  //   this._ballCarrier = kicker;
  // }
  // getStartingPosition() {
  //   return down.getLOS();
  // }
  // putKickerInPosition() {
  //   const { team, id } = this._kicker;
  //   const sevenYardsBehindBall = new DistanceCalculator([
  //     down.getSnapDistance(),
  //     MAP.YARD * 7,
  //   ])
  //     .subtractByTeam(team)
  //     .getDistance();
  //   room.setPlayerDiscProperties(id, {
  //     x: sevenYardsBehindBall,
  //     y: MAP_POINTS.TOP_HASH,
  //   });
  //   return this;
  // }
  // putOffenseInPosition() {
  //   const { team } = this._kicker;
  //   const { offensePlayers } = game.getOffenseDefensePlayers();
  //   const opposingEndzone = getOpposingTeamEndzone(team);
  //   const fiveYardsBeforeEndzone = new DistanceCalculator([
  //     opposingEndzone,
  //     MAP.YARD * 5,
  //   ])
  //     .subtractByTeam(team)
  //     .getDistance();
  //   offensePlayers.forEach(({ id }) => {
  //     if (id === this.getBallCarrier().id) return;
  //     room.setPlayerDiscProperties(id, { x: fiveYardsBeforeEndzone });
  //   });
  //   return this;
  // }
  // putDefenseInPosition() {
  //   const team = game.getDefenseTeam();
  //   const { defensePlayers } = game.getOffenseDefensePlayers();
  //   const opposingEndzone = getOpposingTeamEndzone(game.getOffenseTeam());
  //   const oneYardInFrontOfEndzone = new DistanceCalculator([
  //     opposingEndzone,
  //     MAP.YARD * 1,
  //   ])
  //     .subtractByTeam(team)
  //     .getDistance();
  //   defensePlayers.forEach(({ id }) => {
  //     room.setPlayerDiscProperties(id, { x: oneYardInFrontOfEndzone });
  //   });
  //   return this;
  // }
  // onSuccessfulFieldGoal() {
  //   sendPlayMessage({
  //     type: PLAY_TYPES.FG_GOOD,
  //   });
  //   game.setLivePlay(false);
  //   this.scorePlay(3, game.getOffenseTeam());
  // }
  // onUnsuccessfulFieldGoal() {
  //   sendPlayMessage({
  //     type: PLAY_TYPES.FG_INCOMPLETE,
  //   });
  //   this.endPlay({ isIncomplete: true });
  // }
  // onBallOutOfHashes() {
  //   sendPlayMessage({
  //     type: PLAY_TYPES.FG_INCOMPLETE,
  //   });
  //   this.endPlay({ isIncomplete: true });
  // }
  // onBallContact(ballContactObj) {
  //   // We have to do this check AGAIN because playerOnkick is not an event listener, but a native listener
  //   if (this.getState("ballRan") || this.getState("fieldGoalBlitzed")) return;
  //   super.onBallContact(ballContactObj);
  // }
  // onPlayerContactOffense(contactObj) {
  //   // If he touches
  //   const { player, playerPosition, ballCarrierPosition } = contactObj;
  //   // Verify that its a legal run
  //   const isBehindQuarterBack = checkIfBehind(
  //     playerPosition.x,
  //     ballCarrierPosition.x,
  //     player.team
  //   );
  //   if (isBehindQuarterBack) return this.handleRun(contactObj);
  //   handlePenalty({
  //     type: PENALTY_TYPES.ILLEGAL_RUN,
  //     playerName: player.name,
  //   });
  // }
  // onPlayerContactDefense(contactObj) {
  //   const { player, playerPosition, ballCarrierPosition } = contactObj;
  //   const { team, name } = this.getBallCarrier();
  //   const { netYards, endPosition, endYard, mapSection } = super.getPlayData(
  //     ballCarrierPosition,
  //     team
  //   );
  //   const isSack = checkIfBehind(endPosition, down.getLOS(), team);
  //   sendPlayMessage({
  //     type: isSack ? PLAY_TYPES.SACK : PLAY_TYPES.TACKLE,
  //     playerName: name,
  //     player2Name: player.name,
  //     yard: endYard,
  //     netYards: netYards,
  //     mapSection: mapSection,
  //     position: endPosition,
  //   });
  //   maybeSendQuoteMessage(player.name, netYards);
  //   const isSafety = checkIfSafetyPlayer(ballCarrierPosition, team);
  //   if (isSafety) return super.handleSafety();
  //   this.endPlay({ netYards: netYards, endPosition, endPosition });
  // }
  // onPlayerOutOfBounds(ballCarrierPosition) {
  //   const { team, name } = this.getBallCarrier();
  //   const { netYards, endPosition, endYard } = super.getPlayData(
  //     ballCarrierPosition,
  //     team
  //   );
  //   sendPlayMessage({
  //     type: PLAY_TYPES.PLYR_OUT_OF_BOUNDS,
  //     playerName: name,
  //     yard: endYard,
  //     netYards: netYards,
  //     position: endPosition,
  //   });
  //   const isSafety = checkIfSafetyPlayer(ballCarrierPosition, team);
  //   if (isSafety) return super.handleSafety();
  //   this.endPlay({ netYards: netYards, endPosition: endPosition });
  // }
  // onKickDrag(dragAmount) {
  //   Chat.send("DRAG ON KICK" + dragAmount);
  //   handlePenalty({
  //     type: PENALTY_TYPES.FG_DRAG,
  //     playerName: this._kicker.name,
  //   });
  //   this.endPlay({ isIncomplete: true });
  // }
  // handleRun(contactObj) {
  //   const { player, playerPosition } = contactObj;
  //   sendPlayMessage({ type: PLAY_TYPES.RUN, playerName: player.name });
  //   this.setBallCarrier(player).setState("ballRan");
  // }
  // handleIllegalCrossOffense() {
  //   handlePenalty({
  //     name: PENALTY_TYPES.ILLEGAL_LOS_CROSS,
  //     playerName: this.getBallCarrier().name,
  //   });
  // }
  // handleAutoIncomplete(playerName) {
  //   sendPlayMessage({
  //     type: PLAY_TYPES.FG_INCOMPLETE,
  //     playerName: playerName,
  //   });
  //   this.endPlay({ isIncomplete: true });
  // }
  // handleBallContactDefense(ballContactObj) {
  //   const {
  //     player: { name },
  //   } = ballContactObj;
  //   if (this.getState("fieldGoalKicked") === false)
  //     return this.setState("fieldGoalBlitzed");
  //   sendPlayMessage({
  //     type: PLAY_TYPES.FG_AUTO_GOOD,
  //     playerName: name,
  //   });
  //   this.scorePlay(3, game.getOffenseTeam());
  // }
  // handleBallContactOffense(ballContactObj) {
  //   const {
  //     type,
  //     player: { id, name },
  //   } = ballContactObj;
  //   if (id !== this._kicker.id || this.getState("fieldGoalKicked"))
  //     return this.handleAutoIncomplete(name);
  //   if (type === BALL_CONTACT_TYPES.KICK)
  //     return this.setState("fieldGoalKicked");
  // }
  // endPlay({ isIncomplete = false, netYards, endPosition }) {
  //   if (isIncomplete) {
  //     play = null;
  //     game.setLivePlay(false);
  //     game.swapOffense();
  //     setBallAndFieldMarkersPlayEnd();
  //     setPlayers();
  //     down.startNew();
  //     sendDownAndDistance();
  //     return;
  //   }
  //   super.endPlay({ netYards, endPosition });
  // }
}
