// interface Penalty {}

// interface PenaltyInfo {
//   name;
// }

// const handlePenalty = (penaltyObj) => {
//   quickPause();
//   game.setLivePlay(false);

//   const { type, playerName = "" } = penaltyObj;

//   const { time } = room.getScores();

//   const PENALTIES = [
//     {
//       name: PENALTY_TYPES.SNAP_OUT_OF_HASHES,
//       description: `Illegal Snap, Out Of Hashes, automatic loss of down`,
//       netYards: 0,
//       addDown: true,
//     },
//     {
//       name: PENALTY_TYPES.SNAP_OUT_OF_BOUNDS,
//       description: `Illegal Snap, Out of Bounds, automatic loss of down`,
//       netYards: 0,
//       addDown: true,
//     },
//     {
//       name: PENALTY_TYPES.DOUBLE_HIKE,
//       description: `Double Hike`,
//       netYards: 0,
//       addDown: true,
//     },
//     {
//       name: PENALTY_TYPES.OFFSIDES_OFFENSE,
//       description: `Offsides Offense ${playerName}, 10 yard penalty, repeat the down`,
//       netYards: -10,
//       addDown: false,
//     },
//     {
//       name: PENALTY_TYPES.OFFSIDES_DEFENSE,
//       description: `Offsides Defense ${playerName}, 10 yard penalty, repeat the down`,
//       netYards: 10,
//       addDown: false,
//     },
//     {
//       name: PENALTY_TYPES.SNAP_DRAG,
//       description: `Quarterback Drag, automatic loss of down`,
//       netYards: 0,
//       addDown: true,
//     },
//     {
//       name: PENALTY_TYPES.FG_DRAG,
//       description: `Field Goal Kick Drag, automatic loss of down`,
//       netYards: 0,
//       addDown: true,
//     },
//     {
//       name: PENALTY_TYPES.PUNT_DRAG,
//       description: `Punt Kick Drag, 10 yard penalty, repeat the down`,
//       netYards: -10,
//       addDown: false,
//     },
//     {
//       name: PENALTY_TYPES.ILLEGAL_PASS,
//       description: `Illegal touching of the ball by ${playerName}, automatic loss of down`,
//       netYards: 0,
//       addDown: true,
//     },
//     {
//       name: PENALTY_TYPES.ILLEGAL_RUN,
//       description: `Illegal run by ${playerName}, automatic loss of down`,
//       netYards: 0,
//       addDown: true,
//     },
//     {
//       name: PENALTY_TYPES.ILLEGAL_LOS_CROSS,
//       description: `${playerName} illegally crossed the line of scrimmage, automatic loss of down`,
//       netYards: 0,
//       addDown: true,
//     },
//     {
//       // To plural
//       name: PENALTY_TYPES.ILLEGAL_BLITZ,
//       description: `Illegal blitz by ${playerName} at ${Math.round(
//         time
//       )} seconds, 10 yard penalty, repeat the down`,
//       netYards: 10,
//       addDown: false,
//     },
//     // These have their own handlers
//     {
//       name: PENALTY_TYPES.KICKOFF_DRAG,
//       description: `Kickoff Drag, automatic offense 40 yard line`,
//       netYards: 0,
//       addDown: false,
//       hasOwnHandler: true,
//     },
//     {
//       name: PENALTY_TYPES.KICKOFF_DRAG_SAFETY,
//       description: `Kickoff Drag after a safety, automatic defense 40 yard line`,
//       netYards: 0,
//       addDown: false,
//       hasOwnHandler: true,
//     },
//     {
//       name: PENALTY_TYPES.KICKOFF_OUT_OF_BOUNDS,
//       description: `Kickoff kicked out of bounds, automatic offense 40 yard line`,
//       netYards: 0,
//       addDown: false,
//       hasOwnHandler: true,
//     },
//     {
//       name: PENALTY_TYPES.KICKOFF_OUT_OF_BOUNDS_SAFETY,
//       description: `Kickoff kicked out of bounds after a safety, automatic defense 40 yard line`,
//       netYards: 0,
//       addDown: false,
//       hasOwnHandler: true,
//     },
//     {
//       name: PENALTY_TYPES.KICKOFF_OFFSIDES,
//       description: `Offsides Offense ${playerName}, automatic offense 40 yard line`,
//       netYards: 0,
//       addDown: false,
//       hasOwnHandler: true,
//     },
//     {
//       name: PENALTY_TYPES.KICKOFF_OFFSIDES_SAFETY,
//       description: `Offsides Offense ${playerName} after a safety, automatic defense 40 yard line`,
//       netYards: 0,
//       addDown: false,
//       hasOwnHandler: true,
//     },
//   ];

//   const penalty = PENALTIES.find((penalty) => penalty.name === type);

//   const { description, netYards, addDown } = penalty;

//   Chat.send(`${ICONS.YellowSquare} ${description}`);

//   // The play's handler already does the work
//   if (penalty.hasOwnProperty("hasOwnHandler")) return;

//   const getAdjustedNetYardsForRedzone = () => {
//     const LOSYard = new DistanceCalculator(down.getLOS()).getYardLine();
//     return Math.floor(LOSYard / 2);
//   };

//   const isRedZonePenaltyOnDefense = isInRedzone(down.getLOS()) && netYards > 0;

//   const adjustedNetYards = isRedZonePenaltyOnDefense
//     ? getAdjustedNetYardsForRedzone()
//     : netYards;

//   const endPosition = new DistanceCalculator([
//     down.getLOS(),
//     adjustedNetYards * MAP.YARD,
//   ])
//     .addByTeam(game.getOffenseTeam())
//     .getDistance();

//   const incrementRedZonePenalty = () => {
//     if (!isRedZonePenaltyOnDefense) return;
//     const currentValue = down.getState("redZonePenaltyCounter") ?? 0; // Set it to 0 initially
//     down.setState("redZonePenaltyCounter", currentValue + 1);
//   };

//   incrementRedZonePenalty();

//   const PENALTY_COUNTER_AUTO_TOUCHDOWN = 3;

//   if (down.getState("redZonePenaltyCounter") === PENALTY_COUNTER_AUTO_TOUCHDOWN)
//     return play.handleAutoTouchdown();

//   play.endPlay({
//     netYards: adjustedNetYards,
//     endPosition: endPosition,
//     addDown: addDown,
//   });
// };

// const PENALTY_TYPES = {
//   SNAP_OUT_OF_HASHES: "Snap Out Of Hashes",
//   SNAP_OUT_OF_BOUNDS: "Snap Out Of Bounds",
//   DOUBLE_HIKE: "Double Hike",
//   OFFSIDES_OFFENSE: "Offsides Offense",
//   OFFSIDES_DEFENSE: "Offsides Defense",
//   SNAP_DRAG: "Snap Drag",
//   FG_DRAG: "Field Goal Drag",
//   PUNT_DRAG: "Punt Drag",
//   KICKOFF_DRAG: "Kickoff Drag",
//   KICKOFF_DRAG_SAFETY: "Kickoff Drag Safety",
//   KICKOFF_OUT_OF_BOUNDS: "Kick Off Out Of Bounds",
//   KICKOFF_OUT_OF_BOUNDS_SAFETY: "Kick Off Out Of Bounds Safety",
//   KICKOFF_OFFSIDES: "Kick Off Offsides Offense",
//   KICKOFF_OFFSIDES_SAFETY: "Kick Off Offsides Offense Safety",
//   ILLEGAL_PASS: "Illegal Pass",
//   ILLEGAL_RUN: "Illegal Run",
//   ILLEGAL_LOS_CROSS: "Illegal LOS Cross",
//   ILLEGAL_BLITZ: "Illegal Blitz",
// };

// SnapCheckForPenalties() {
//   const snapOutOfBoundsCheck = () => {
//     const { position } = getPlayerDiscProperties(this._quarterback.id);
//     const isOutOfBounds = checkIfOutOfBounds(position, MAP.PLAYER_RADIUS);
//     return isOutOfBounds ? { type: PENALTY_TYPES.SNAP_OUT_OF_BOUNDS } : null;
//   };

//   const snapOutsideHashesCheck = () => {
//     const { position } = getPlayerDiscProperties(this._quarterback.id);
//     const withinHash = checkIfWithinHash(position, MAP.PLAYER_RADIUS);
//     return withinHash ? null : { type: PENALTY_TYPES.SNAP_OUT_OF_HASHES };
//   };

//   const checkOffsideOffense = () => {
//     const { offensePlayers } = game.getOffenseDefensePlayers();
//     const offensiveTeam = game.getOffenseTeam();
//     const offsidePlayer = getOffsidePlayer(offensePlayers, offensiveTeam);
//     return Boolean(offsidePlayer)
//       ? {
//           type: PENALTY_TYPES.OFFSIDES_OFFENSE,
//           playerName: offsidePlayer.name,
//         }
//       : null;
//   };

//   const checkOffsideDefense = () => {
//     const { defensePlayers } = game.getOffenseDefensePlayers();
//     const defensiveTeam = game.getDefenseTeam();
//     const offsidePlayer = getOffsidePlayer(defensePlayers, defensiveTeam);
//     return Boolean(offsidePlayer)
//       ? {
//           type: PENALTY_TYPES.OFFSIDES_DEFENSE,
//           playerName: offsidePlayer.name,
//         }
//       : null;
//   };

//   // Put it in an array so we can control the order of the functions
//   const penaltyArray = [
//     snapOutOfBoundsCheck(),
//     snapOutsideHashesCheck(),
//     checkOffsideOffense(),
//     checkOffsideDefense(),
//   ];

//   const penaltyObj = penaltyArray.find(
//     (penalty) => Boolean(penalty) === true
//   );

//   if (Boolean(penaltyObj)) {
//     handlePenalty(penaltyObj);
//     return true;
//   }
//   return false;
// }
