import BallContact from "../classes/BallContact";
import { PLAY_STATES } from "../plays/BasePlay";
import Ball from "../structures/Ball";
import DistanceCalculator from "../structures/DistanceCalculator";
import { MAP__AREAS } from "../utils/map";
import { getPlayerDiscProperties } from "../utils/haxUtils";
import Room from "..";
import MapReferee from "../structures/MapReferee";
import { PlayerObject } from "../HBClient";
import PlayerContact from "../classes/PlayerContact";
import { checkBallCarrierContact, checkBallContact } from "./tickEvents";
import Chat from "../roomStructures/Chat";

const eventListeners: EventListener[] = [
  {
    // Pass Incompletes, Punts/Kickoffs Out Of Bounds
    name: "Ball Out Of Bounds",
    runWhen: ["ballSnapped", "punt", "kickOff"],
    stopWhen: ["ballCaught", "ballRan", "puntCaught", "kickOffCaught"],
    run: () => {
      const ballOutOfBounds = MapReferee.checkIfBallOutOfBounds(); // This returns either null or the ballPosition,
      if (ballOutOfBounds)
        return Room?.game?.play?.handleBallOutOfBounds(ballOutOfBounds);
    },
  },
  {
    // Field Goal Out Of Hashes, Field Goal Successful
    name: "Ball Field Goal",
    runWhen: ["fieldGoal"],
    stopWhen: ["fieldGoalBlitzed", "ballRan"],
    run: () => {
      //   // Here we check if the ball is within the hashes,
      //   // Check if the ball has enough speed to even reach the field goal posts
      //   // Check if the ball went through the posts
      //   const withinHash = checkIfWithinHash(ball.getPosition(), MAP.BALL_RADIUS);
      //   if (!withinHash) return play.handleBallOutOfHashes();
      //   const successfulFieldGoal = checkIfFieldGoalSuccessful();
      //   if (successfulFieldGoal) return play.handleSuccess();
      //   if (play.getState("fieldGoalKicked")) {
      //     const ballMoving = checkIfBallIsMoving();
      //     if (!ballMoving) return play.handleIncomplete("FROM EVENT LISTENER");
      //   }
    },
  },
  {
    // Catches, Pass Deflections, Field Goal Incomplete, Field Goal Auto, DownedBall, Punt Catch, Kickoff Catch
    name: "Ball Contact",
    runWhen: ["always"],
    stopWhen: [
      "ballCaught",
      "ballRan",
      "ballBlitzed",
      "fieldGoalBlitzed",
      "puntCaught",
      "kickOffCaught",
    ],
    run: () => {
      const ballContact = checkBallContact();
      if (ballContact !== null)
        return Room.getPlay().handleBallContact(ballContact);
    },
  },
  {
    // Player Out Of Bounds and Player Touchdowns
    name: "BallCarrier Position Tracker",
    runWhen: ["ballSnapped", "fieldGoal", "puntCaught", "kickOffCaught"],
    stopWhen: ["fieldGoalKicked"],
    run: function () {
      const ballCarrier = Room.getPlay().getBallCarrier();

      const ballCarrierOutOfBounds =
        MapReferee.checkIfPlayerOutOfBounds(ballCarrier);

      if (ballCarrierOutOfBounds)
        return Room.getPlay().handleBallCarrierOutOfBounds(
          ballCarrierOutOfBounds
        );

      const isTouchdown = MapReferee.checkIfTouchdown(ballCarrier);
      if (isTouchdown) return Room.getPlay().handleTouchdown();
    },
  },
  {
    // Tackles, Sacks, Fumbles
    name: "BallCarrier Player Contact Defense",
    runWhen: ["ballSnapped", "fieldGoal", "puntCaught", "kickOffCaught"],
    stopWhen: ["ballIntercepted"],
    run: () => {
      // Here we get the defensive team, and use as an argument to the function
      const defensePlayers = Room!.game!.players.getDefense();
      if (defensePlayers.length === 0) return;
      const playerContact = checkBallCarrierContact(defensePlayers);
      if (playerContact)
        return Room.getPlay().onPlayerContactDefense(playerContact);
    },
  },
  {
    // Runs
    name: "BallCarrier Player Contact Same Team",
    runWhen: ["ballSnapped", "fieldGoal"],
    stopWhen: ["ballRan", "ballCaught", "ballIntercepted"],
    run: () => {
      // Here we get the offensive team, filter out the QB, and use as an argument to the function
      const offensePlayersNoQb = Room.game.players.getOffenseNoQb();
      const playerContact = checkBallCarrierContact(offensePlayersNoQb);
      if (playerContact)
        return Room.getPlay().onPlayerContactOffense(playerContact);
    },
  },
  {
    // Early Blitz Penalty
    name: "Defense Position",
    runWhen: ["ballSnapped", "fieldGoal"],
    stopWhen: ["blitzed", "ballRan", "ballPassed", "fieldGoalKicked"],
    run: () => {
      // const { defensePlayers } = game.getOffenseDefensePlayers();
      // const defensiveTeam = game.getDefenseTeam();
      // const offsidePlayer = getOffSidePlayerNoAdjust(
      //   defensePlayers,
      //   defensiveTeam
      // );
      // if (offsidePlayer) {
      //   // Check if can blitz
      //   const canBlitz = play.getState("canBlitz");
      //   if (canBlitz) {
      //     play.setState("blitzed");
      //   } else {
      //     return handlePenalty({
      //       type: PENALTY_TYPES.ILLEGAL_BLITZ,
      //       playerName: offsidePlayer.name,
      //     });
      //   }
      // }
      // // Check if a blue player is offside
    },
  },
  {
    // Early LOS Cross Penalty
    name: "Quarterback and Kicker Position",
    runWhen: [], //"snap", "fieldGoal"
    stopWhen: ["ballRan", "ballPassed", "fieldGoalKicked", "blitzed"],
    run: () => {
      // const { id, team } = play.getBallCarrier(); // This is really either the QB, or the kicker
      // const {
      //   position: { x },
      // } = getPlayerDiscProperties(id);
      // const qbPosition = new DistanceCalculator([x, MAP.PLAYER_RADIUS])
      //   .addByTeam(team)
      //   .getDistance();
      // const isBehindLOS = checkIfBehind(qbPosition, down.getLOS(), team);
      // if (!isBehindLOS) return play.handleIllegalCrossOffense();
    },
  },
  {
    // Kick Drag Pass, FG, Punt, Kickoff
    name: "Kick Drag",
    runWhen: ["always"],
    stopWhen: [
      "ballPassed",
      "ballBlitzed",
      "ballRan",
      "fieldGoalKicked",
      "fieldGoalBlitzed",
      "puntKicked",
      "kickOffKicked",
    ],
    run: () => {
      // Each Play has a this.MAX_DRAG_DISTANCE
      //  const MAX_DRAG_DISTANCE = 10;
      //  const dragAmount = new DistanceCalculator([
      //    play.getBallPositionOnSet(),
      //    ball.getPosition(),
      //  ])
      //    .calcDifference()
      //    .getDistance();
      //  if (dragAmount > MAX_DRAG_DISTANCE) return play.onKickDrag(dragAmount);
    },
  },
];

export default function onGameTick() {
  // Check if bot is even on
  if (!Room.isBotOn) return;

  try {
    eventListeners.forEach((listenerObj) => {
      if (!Room?.game?.play?.isLivePlay) return;
      if (!checkIfRunListener(listenerObj)) return;
      if (checkIfStopListener(listenerObj)) return;
      listenerObj.run();
    });
  } catch (error) {
    console.trace(error);
    Chat.send(error.message);
    // game.hardReset();
    // Some kind of reset goes here
  }
}

interface EventListener {
  name: string;
  runWhen: PLAY_STATES[];
  stopWhen: PLAY_STATES[];
  run: () => void;
}

const checkIfRunListener = (listenerObj: EventListener) =>
  listenerObj.runWhen.some(
    (state) => state === "always" || Room.getPlay().readStateUnsafe(state)
  );

const checkIfStopListener = (listenerObj: EventListener) =>
  listenerObj.stopWhen.some((state) => Room.getPlay().readStateUnsafe(state));
