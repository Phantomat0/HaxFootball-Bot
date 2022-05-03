const PLAY_TYPES = {
  PASS_CATCH: "pass catch",
  PASS_DEFLECTION: "pass deflection",
  PASS_OUT_OF_BOUNDS: "pass out of bounds",
  KICK_CATCH: "kick catch",
  KICK_OUT_OF_BOUNDS: "kick out of bounds",
  KICK_DOWNED: "kick downed",
  FG_INCOMPLETE: "field goal incomplete",
  FG_GOOD: "field goal good",
  FG_AUTO_GOOD: "field goal auto good",
  FG_AUTO_INCOMPLETE: "field goal auto good",
  PLYR_OUT_OF_BOUNDS: "player out of bounds",
  CATCH_OUT_OF_BOUNDS: "caught out of bounds",
  TOUCHDOWN: "touchdown",
  RUN: "run",
  FUMBLE: "fumble",
  TACKLE: "tackle",
  SACK: "sack",
  TOUCHBACK: "touchback",
  SAFETY: "safety",
};

roomInit();

const sendMessageMaybeWithClock = (message) => {
  const WARNING_TIME = 600;
  const { time } = room.getScores();
  return Chat.send(`${message} ${time >= WARNING_TIME ? toClock(time) : ""}`);
};

const fumbleCheck = (playerSpeed, ballCarrierSpeed) => {
  const FUMBLE_SPEED = 3;
  const playerXSpeed = Math.abs(playerSpeed.x);
  const playerYSpeed = Math.abs(playerSpeed.y);

  const ballCarrierXSpeed = Math.abs(ballCarrierSpeed.x);
  const ballCarrierYSpeed = Math.abs(ballCarrierSpeed.y);

  const totalPlayerSpeed = (playerXSpeed + playerYSpeed).toFixed(3);

  Chat.send(totalPlayerSpeed);

  if (totalPlayerSpeed > FUMBLE_SPEED) {
    // Chat.send(totalPlayerSpeed)
    return true;
  }

  return false;
};

const sendScoreBoard = () => {
  const { redScore, blueScore } = game.getScore();

  Chat.send(
    `${ICONS.RedSquare} ${redScore} -  ${blueScore} ${ICONS.BlueSquare}`
  );
};

class Game {
  constructor() {
    this._red = {
      players: [],
      score: 0,
    };
    this._blue = {
      players: [],
      score: 0,
    };
    (this._offenseTeamID = 1), (this._fieldedPlayers = []);
    this._events = [];
    this._isLivePlay = false;
  }

  getLivePlay() {
    return this._isLivePlay;
  }

  setLivePlay(bool) {
    this._isLivePlay = Boolean(bool);
    return this;
  }

  // Resets everything
  hardReset() {
    this.setLivePlay(false);
    play?.reset();
    down?.startNew();
  }
}

const sendDownAndDistance = () => {
  const getDownStr = () => {
    const downStrings = {
      1: "1st",
      2: "2nd",
      3: "3rd",
      4: "4th",
      5: "5th",
    };
    return downStrings[down.getDown()];
  };

  const showYardsOrGoal = () => {
    const lineToGain = new DistanceCalculator([
      down.getLOS(),
      MAP.YARD * down.getYards(),
    ])
      .addByTeam(game.getOffenseTeam())
      .getDistance();

    if (lineToGain <= MAP.RED_ENDZONE || lineToGain >= MAP.BLUE_ENDZONE)
      return "GOAL";
    return down.getYards();
  };

  const getLOSYard = () => {
    return new DistanceCalculator(down.getLOS()).getYardLine();
  };

  const showRedZonePenaltiesIfAvail = () => {
    const currentRedZonePenalties = down.getState("redZonePenaltyCounter");
    if (currentRedZonePenalties === false) return ""; // If there are no redzone penalties
    return ` [${currentRedZonePenalties}/3]`;
  };

  const LOSHalfStr = getHalfStr(down.getLOS());

  Chat.send(
    `${getDownStr()} & ${showYardsOrGoal()} at ${LOSHalfStr}${getLOSYard()}${showRedZonePenaltiesIfAvail()}`
  );
};

const sendPlayMessage = (playObj) => {
  const {
    type,
    playerName = "",
    player2Name = "",
    yard = "",
    netYards = "",
    mapSection = "null",
    position = down.getLOS(),
  } = playObj;

  const getMessage = () => {
    console.log(playObj);

    const name1 = truncateName(playerName);
    const name2 = truncateName(player2Name);

    const aGainOrLoss = getNetYardsMessage(netYards);
    const atTheYardOrEndzone = getYardMessage(yard, position);

    switch (type) {
      case PLAY_TYPES.PASS_CATCH:
        return `${ICONS.Football} Pass caught by ${name1} ${atTheYardOrEndzone}`;
      case PLAY_TYPES.PASS_DEFLECTION:
        return `${ICONS.DoNotEnter} Incomplete - pass broken up by ${name1}`;
      case PLAY_TYPES.PASS_OUT_OF_BOUNDS:
        return `${ICONS.DoNotEnter} Incomplete - ball went out of bounds ${atTheYardOrEndzone}`;
      case PLAY_TYPES.CATCH_OUT_OF_BOUNDS:
        return `${ICONS.DoNotEnter} Incomplete - caught out of bounds by ${name1} ${atTheYardOrEndzone}`;
      case PLAY_TYPES.KICK_CATCH:
        return `${ICONS.Football} Kick caught by ${name1} ${atTheYardOrEndzone}`;
      case PLAY_TYPES.KICK_OUT_OF_BOUNDS:
        return `${ICONS.Pushpin} Kick kicked out of bounds ${atTheYardOrEndzone}`;
      case PLAY_TYPES.KICK_DOWNED:
        return `${ICONS.SpeakingHead} Kick downed by kicking team`;
      case PLAY_TYPES.FG_INCOMPLETE:
        return `${ICONS.X} Field goal incomplete!`;
      case PLAY_TYPES.FG_GOOD:
        return `${ICONS.Target} Field goal is good!`;
      case PLAY_TYPES.FG_AUTO_GOOD:
        return `${ICONS.Target} Auto Field Goal! - llegally touched by ${name1}`;
      case PLAY_TYPES.FG_AUTO_INCOMPLETE:
        return `${ICONS.X} Incomplete - illegally touched by ${name1}`;
      case PLAY_TYPES.PLYR_OUT_OF_BOUNDS:
        return `${ICONS.Pushpin} ${name1} stepped out of bounds ${atTheYardOrEndzone} for ${aGainOrLoss}`;
      case PLAY_TYPES.RUN:
        return `${ICONS.Running} Run by ${name1}`;
      case PLAY_TYPES.FUMBLE:
        return `${ICONS.Collision} ${name1} fumbled the ball ${atTheYardOrEndzone}, recovered by ${name2}`;
      case PLAY_TYPES.TACKLE:
        return `${ICONS.HandFingersSpread} ${name2} tackled ${name1} ${atTheYardOrEndzone}, for ${aGainOrLoss}`;
      case PLAY_TYPES.SACK:
        return `${ICONS.HandFingersSpread} ${name2} sacked ${name1} ${atTheYardOrEndzone}, for ${aGainOrLoss}`;
      case PLAY_TYPES.TOUCHDOWN:
        return `${ICONS.Fire} TOUCHDOWN! ${name1} with ${aGainOrLoss}`;
      case PLAY_TYPES.TOUCHBACK:
        return `${ICONS.Loudspeaker} Touchback - ball placed at the receiving team's 20 yard line.`;
      case PLAY_TYPES.SAFETY:
        return `${ICONS.Loudspeaker} Safety - kickoff from the 20 yard line`;
      default:
        return "No message for this play";
    }
  };

  Chat.send(getMessage());
};

// Master Class for all plays

const maybeSendQuoteMessage = (playerName, netyards) => {
  console.log(netyards);
  const isSnap = play instanceof Snap;
  // Only send it if its a snap and the netYards was less than 1

  return;

  if (netyards < 1 && isSnap) return;

  const quotesArray = [
    `${ICONS.Clown} WHAT ARE YOU DOING?`,
    `ıllıllı ʙɪɢ ʜɪᴛ ıllıllı`,
    ` ${ICONS.Lock} L O C K D O W N ${ICONS.Lock}`,
    `${ICONS.Police} GET THE TRAINER ${ICONS.Police}`,
    `QUARTERBACK's head = IM IN IT`,
  ];

  const randomInt = getRandomInt(quotesArray.length);

  const quoteString = quotesArray[randomInt];

  Chat.send(`${playerName}: ${quoteString}`);
};

const setBallAndFieldMarkersPlayEnd = () => {
  ball.setPosition({ x: down.getSnapDistance(), y: 0 }).suppress();
  down.moveFieldMarkers();
};

const setPlayers = () => {
  const offensePositionsMap = play.getState("offensePositions") || new Map();
  const defensePositionsMap = play.getState("defensePositions") || new Map();

  console.log(defensePositionsMap);

  const { offensePlayers, defensePlayers } = game.getOffenseDefensePlayers();

  offensePlayers.forEach((player) => {
    const newXPos = new DistanceCalculator([
      down.getSnapDistance(),
      MAP.YARD * 7,
    ])
      .subtractByTeam(game.getOffenseTeam())
      .getDistance();

    const hasOldYPos = offensePositionsMap.get(player.id) ?? null;
    room.setPlayerDiscProperties(player.id, {
      x: newXPos,
    });

    if (hasOldYPos) {
      room.setPlayerDiscProperties(player.id, {
        y: hasOldYPos.y,
      });
    }
  });

  defensePlayers.forEach((player) => {
    const newXPos = new DistanceCalculator([down.getLOS(), MAP.YARD * 5])
      .subtractByTeam(game.getDefenseTeam())
      .getDistance();

    const hasOldYPos = defensePositionsMap.get(player.id) ?? null;
    room.setPlayerDiscProperties(player.id, {
      x: newXPos,
    });

    if (hasOldYPos) {
      room.setPlayerDiscProperties(player.id, {
        y: hasOldYPos.y,
      });
    }
  });
};

const checkOffsideDefense = () => {
  const { defensePlayers } = game.getOffenseDefensePlayers();
  const defensiveTeam = game.getDefenseTeam();
  const LOS = down.getLOS();

  defensePlayers.find((player) => {
    const {
      position: { x },
    } = getPlayerDiscProperties(player.id);
    const isOnside = checkIfBehind(x, LOS, defensiveTeam);
    return !isOnside;
  });
};

const getOffsidePlayer = (playerArray, team) => {
  const LOS = down.getLOS();
  return (
    playerArray.find((player) => {
      const { x } = DistanceCalculator.adjustPlayerPosition(player);
      return !checkIfBehind(x, LOS, team);
    }) ?? null
  );
};

// No adjusting player position
const getOffSidePlayerNoAdjust = (playerArray, team) => {
  const LOS = down.getLOS();
  return (
    playerArray.find((player) => {
      const {
        position: { x },
      } = getPlayerDiscProperties(player.id);
      return !checkIfBehind(x, LOS, team);
    }) ?? null
  );
};

const Event = {
  listeners: [],
  types: {
    KICKOFF: "Kickoff",
    PUNT: "Punt",
    SNAP: "Snap",
    RUN: "Run",
    PASS_SUCCESSFUL: "Pass Successful",
    PASS_DEFLECTION: "Pass Deflection",
    PASS_INCOMPLETE: "Incomplete Pass",
    TACKLE: "Tackle",
    SACK: "Sack",
    FUMBLE: "Fumble",
    TOUCHDOWN: "Touchdown",
    FG_ATTEMPT: "Field Goal Attempt",
    FG_MISS: "Field Goal Miss",
    FG_INCOMPLETE: "Field Goal Incomplete",
    FG_SUCCESSFUL: "Field Goal Successful",
    FG_AUTO: "Automatic Field Goal",
    OUT_OF_BOUNDS_PLAYER: "Stepped out of bounds",
    KICK_CAUGHT: "Kick caught",
    KICK_DOWNED: "Kick downed",
    OUT_OF_BOUNDS_KICK: "Kick out of bounds",
    INTERCEPTION_ATTEMPT: "Interception attempt",
    INTERCEPTION_SUCCESSFUL: "Interception successful",
    TIME_OUT: "Time Out",
  },
};

function snapInit(player) {
  const { time } = room.getScores();

  if (player.team !== game.getOffenseTeam()) {
    return Chat.send("You are not on offense!", { id: player.id });
  }
  const HIKE_MSG = `${ICONS.GreenCircle} Ball is Hiked`;
  sendMessageMaybeWithClock(HIKE_MSG);

  play = new Snap(time, player);

  // Set the player positions

  const { offensePlayers, defensePlayers } = game.getOffenseDefensePlayers();

  const offensePositionsArray = offensePlayers.map((player) => {
    const playerPosition = room.getPlayerDiscProperties(player.id);
    return [player.id, { x: playerPosition.x, y: playerPosition.y }];
  });
  const defensePositionsArray = defensePlayers.map((player) => {
    const playerPosition = room.getPlayerDiscProperties(player.id);
    return [player.id, { x: playerPosition.x, y: playerPosition.y }];
  });

  const offensePositionsMap = new Map(offensePositionsArray);
  const defensePositionsMap = new Map(defensePositionsArray);

  console.log(defensePositionsArray);
  console.log(defensePositionsMap);

  play.setState("offensePositions", offensePositionsMap);
  play.setState("defensePositions", defensePositionsMap);

  const isPenalty = play.checkForPenalties();
  if (isPenalty) return;

  play
    .setState("snap")
    .positionBallAndFieldMarkers()
    .setBallPositionOnSet(ball.getPosition());
  ball.release();
  game.setLivePlay(true);
}

function fieldGoalInit(player) {
  const { time } = room.getScores();

  quickPause();

  const yardInt = new DistanceCalculator(down.getLOS()).getYardLine();

  const FG_MSG = `${ICONS.PurpleCircle} Field Goal Called, ${yardInt} yard attempt`;
  sendMessageMaybeWithClock(FG_MSG);

  play = new FieldGoal(time, player);

  play
    .setState("fieldGoal")
    .setState("canBlitz")
    .positionBallAndFieldMarkers()
    .putKickerInPosition()
    .putOffenseInPosition()
    .putDefenseInPosition();

  play.setBallPositionOnSet(ball.getPosition());
  ball.release();
  game.setLivePlay(true);
}

function twoPointPrepare() {
  // Quickpause

  down.setState("twoPoint");
  const TWO_POINT_MSG = `${ICONS.BrownCircle} Two point conversion called`;
  sendMessageMaybeWithClock(TWO_POINT_MSG);

  const defenseEndZone = getTeamEndzone(game.getDefenseTeam());

  const defenseTenYardLine = new DistanceCalculator([
    defenseEndZone,
    10 * MAP.YARD,
  ])
    .addByTeam(game.getDefenseTeam())
    .getDistance();

  ball.removeGravity();
  ball.suppress();
  down.setLOS(defenseTenYardLine);
  play.positionBallAndFieldMarkers();
}

function twoPointInit(player) {
  const { time } = room.getScores();

  const HIKE_MSG = `${ICONS.GreenCircle} Ball is Hiked`;
  sendMessageMaybeWithClock(HIKE_MSG);

  play = new TwoPoint(time, player);

  const isPenalty = play.checkForPenalties();
  if (isPenalty) return;

  // Two point has the exact same mechanics as a snap
  play.setState("twoPoint");
  play.setState("snap");

  play.setBallPositionOnSet(ball.getPosition());
  ball.release();
  game.setLivePlay(true);

  // Set the players
}

function puntInit(player) {
  const { time } = room.getScores();
  const PUNT_MSG = `${ICONS.OrangeCircle} Punt Called`;
  sendMessageMaybeWithClock(PUNT_MSG);

  play = new Punt(time);

  play
    .setState("punt")
    .positionBallAndFieldMarkers()
    .putOffenseInPosition()
    .putDefenseInPosition()
    .createInvisibleWallForDefense();

  play.setBallPositionOnSet(ball.getPosition());
  ball.release();
  game.setLivePlay(true);
}

async function kickOffInit() {
  const { time } = room.getScores();
  const getKickOffPosition = () => {
    if (down.getState("safetyKickOff")) {
      const offenseEndZone = getTeamEndzone(game.getOffenseTeam());
      return (offenseTwentyYardLine = new DistanceCalculator([
        offenseEndZone,
        MAP.YARD * 20,
      ])
        .addByTeam(game.getOffenseTeam())
        .getDistance());
    }

    return MAP.KICKOFF;
  };

  const kickOffPosition = getKickOffPosition();

  play = new KickOff(time);

  down.setLOS(kickOffPosition).moveFieldMarkers();

  play
    .setState("kickOff")
    .positionBallAndFieldMarkers()
    .putOffenseInPosition()
    .putDefenseInPosition()
    .createInvisibleWallForDefense();

  await play.setBallPositionOnSet({ x: kickOffPosition, y: 0 });
  ball.release();

  await game.setLivePlay(true);
}
