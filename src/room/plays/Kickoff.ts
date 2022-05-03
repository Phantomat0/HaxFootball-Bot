import Punt from "./Punt";

export type KICK_OFF_PLAY_STATES =
  | "kickOff"
  | "kickOffCaught"
  | "kickOffKicked";

export default class KickOff extends Punt {
  // constructor(time: number) {
  //   super(time);
  // }
  // putOffenseInPosition() {
  //   return this;
  // }
  // putDefenseInPosition() {
  //   return this;
  // }
  // createInvisibleWallForDefense() {
  //   return this;
  // }
  // onKickDrag(dragAmount) {
  //   Chat.send("DRAG ON KICK" + dragAmount);
  //   // We have to get the closest player to the ball to determine the kicker, since it could be anyone
  //   const { name } = getClosestPlayerToBall();
  //   // Which forty yard line depends on if its a safety
  //   const team = down.getState("safetyKickOff")
  //     ? game.getOffenseTeam()
  //     : game.getDefenseTeam();
  //   const offenseOrDefenseEndZone = getTeamEndzone(team);
  //   const offenseOrDefenseFortyYardLine = new DistanceCalculator([
  //     offenseOrDefenseEndZone,
  //     MAP.YARD * 40,
  //   ])
  //     .addByTeam(team)
  //     .getDistance();
  //   handlePenalty({
  //     type: down.getState("safetyKickOff")
  //       ? PENALTY_TYPES.KICKOFF_DRAG_SAFETY
  //       : PENALTY_TYPES.KICKOFF_DRAG,
  //     playerName: name,
  //   });
  //   this.endPlay({
  //     endPosition: offenseOrDefenseFortyYardLine,
  //     swapOffense: true,
  //   });
  // }
  // onBallContact(ballContactObj) {
  //   // We have to do this check AGAIN because playerOnkick is not an event listener, but a native listener
  //   if (this.getState("kickOffCaught")) return;
  //   super.onBallContact(ballContactObj);
  // }
  // onBallOutOfBounds(ballPosition) {
  //   const { x } = ballPosition;
  //   const team = game.getDefenseTeam();
  //   const roundedX = new DistanceCalculator(x).roundByTeam(team);
  //   sendPlayMessage({
  //     type: PLAY_TYPES.KICK_OUT_OF_BOUNDS,
  //     yard: roundedX.getYardLine(),
  //     position: roundedX.getDistance(),
  //   });
  //   const determineWhichPenalty = () => {
  //     if (down.getState("safetyKickOff")) {
  //       handlePenalty({ type: PENALTY_TYPES.KICKOFF_OUT_OF_BOUNDS_SAFETY });
  //     } else {
  //       handlePenalty({ type: PENALTY_TYPES.KICKOFF_OUT_OF_BOUNDS });
  //     }
  //   };
  //   const getPenaltyYardLinePosition = () => {
  //     if (down.getState("safetyKickOff")) {
  //       const opposingTeamFortyYardLinePosition = new DistanceCalculator([
  //         MAP.KICKOFF,
  //         MAP.YARD * 10,
  //       ])
  //         .addByTeam(team)
  //         .getDistance();
  //       return opposingTeamFortyYardLinePosition;
  //     }
  //     const teamFortyYardLinePosition = new DistanceCalculator([
  //       MAP.KICKOFF,
  //       MAP.YARD * 10,
  //     ])
  //       .subtractByTeam(team)
  //       .getDistance();
  //     return teamFortyYardLinePosition;
  //   };
  //   determineWhichPenalty();
  //   this.endPlay({
  //     endPosition: getPenaltyYardLinePosition(),
  //     swapOffense: true,
  //   });
  // }
  // handleCatch(ballContactObj) {
  //   game.swapOffense();
  //   const {
  //     player,
  //     playerPosition: { x },
  //   } = ballContactObj;
  //   const { name, team } = player;
  //   const adjustedX = new DistanceCalculator([x, MAP.PLAYER_RADIUS])
  //     .addByTeam(team)
  //     .roundByTeam()
  //     .roundToMap();
  //   this.setState("catchPosition", adjustedX.getDistance());
  //   this.setState("kickOffCaught");
  //   sendPlayMessage({
  //     type: PLAY_TYPES.KICK_CATCH,
  //     playerName: name,
  //     yard: adjustedX.getYardLine(),
  //     position: adjustedX.getDistance(),
  //   });
  //   this.setBallCarrier(player);
  // }
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
