import BallContact from "../classes/BallContact";
import { PLAY_STATES } from "../plays/basePlay";
import Ball from "../structures/Ball";
import DistanceCalculator from "../structures/DistanceCalculator";
import Room from "../roomStructures/Room";
import { MAP__AREAS } from "../utils/map";
import { getPlayerDiscProperties } from "../utils/haxUtils";

const eventListeners: EventListener[] = [
  {
    // Pass Incompletes, Punts/Kickoffs Out Of Bounds
    name: "Ball Out Of Bounds",
    runWhen: ["ballSnapped", "punt", "kickOff"],
    stopWhen: ["ballCaught", "ballRan", "puntCaught", "kickOffCaught"],
    run: () => {
      //   const ballOutOfBounds = checkIfBallOutOfBounds(); // This returns either null or the ballPosition,
      //   if (ballOutOfBounds !== null)
      //     return play.handleBallOutOfBounds(ballOutOfBounds);
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
      console.log(ballContact);
      if (ballContact !== null) return Room.play.handleBallContact(ballContact);
    },
  },
  {
    // Player Out Of Bounds and Player Touchdowns
    name: "BallCarrier Position Tracker",
    runWhen: ["ballSnapped", "fieldGoal", "puntCaught", "kickOffCaught"],
    stopWhen: ["fieldGoalKicked"],
    run: function () {
      //   const ballCarrier = play.getBallCarrier();
      //   const ballCarrierOutOfBounds = checkIfPlayerOutOfBounds(ballCarrier);
      //   const isTouchdown = checkIfTouchdown(ballCarrier);
      //   if (ballCarrierOutOfBounds)
      //     return play.handleBallCarrierOutOfBounds(ballCarrierOutOfBounds);
      //   if (isTouchdown) return play.handleTouchdown();
    },
  },
  {
    // Tackles, Sacks, Fumbles
    name: "BallCarrier Player Contact Opposing Team",
    runWhen: ["ballSnapped", "fieldGoal", "puntCaught", "kickOffCaught"],
    stopWhen: ["ballIntercepted"],
    run: () => {
      //   // Here we get the defensive team, and use as an argument to the function
      //   const { defensePlayers } = game.getOffenseDefensePlayers();
      //   if (defensePlayers.length === 0) return;
      //   const playerContact = checkBallCarrierContact(defensePlayers);
      //   if (playerContact !== null)
      //     return play.handleBallCarrierContactOpposingTeam(playerContact);
    },
  },
  {
    // Runs
    name: "BallCarrier Player Contact Same Team",
    runWhen: ["ballSnapped", "fieldGoal"],
    stopWhen: ["ballRan", "ballCaught", "ballIntercepted"],
    run: () => {
      //   // Here we get the offensive team, filter out the QB, and use as an argument to the function
      //   const { offensePlayers } = game.getOffenseDefensePlayers();
      //   const playerContact = checkBallCarrierContact(offensePlayers);
      //   if (playerContact !== null)
      //     return play.handleBallCarrierContactSameTeam(playerContact);
    },
  },
  {
    // Early Blitz Penalty
    name: "Defense Position",
    runWhen: ["always"],
    stopWhen: [],
    run: () => {},
  },
  {
    // Early LOS Cross Penalty
    name: "Quarterback Position",
    runWhen: ["always"],
    stopWhen: [],
    run: () => {},
  },
  {
    // Kick Drag Pass, FG, Punt, Kickoff
    name: "Kick Drag",
    runWhen: ["always"],
    stopWhen: [],
    run: () => {
      // Each Play has a this.MAX_DRAG_DISTANCE
    },
  },
];

export default function onGameTick() {
  eventListeners.forEach((listenerObj) => {
    if (!Room.play || !Room.play.isLivePlay) return;
    if (!checkIfRunListener(listenerObj)) return;
    if (checkIfStopListener(listenerObj)) return;
    listenerObj.run();
  });
}

interface EventListener {
  name: string;
  runWhen: PLAY_STATES[];
  stopWhen: PLAY_STATES[];
  run: () => void;
}

const checkIfRunListener = (listenerObj: EventListener) =>
  listenerObj.runWhen.some(
    (state) => state === "always" || Room.play.readStateUnsafe(state)
  );

const checkIfStopListener = (listenerObj: EventListener) =>
  listenerObj.stopWhen.some((state) => Room.play.readStateUnsafe(state));

const checkBallContact = () => {
  const TOUCHING_DISTANCE =
    MAP__AREAS.BALL_RADIUS + MAP__AREAS.PLAYER_RADIUS + 0.01;
  const ballPosition = Ball.getPosition();
  const fielded = Room.getPlayers();

  for (const player of fielded) {
    const { id } = player;
    const { position: playerPosition } = getPlayerDiscProperties(id);

    const distanceToBall = new DistanceCalculator().calcDifference3D(
      playerPosition,
      ballPosition
    );

    if (distanceToBall < TOUCHING_DISTANCE)
      return new BallContact("touch", player, playerPosition);
  }

  return null;
};
