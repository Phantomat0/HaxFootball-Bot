const room = HBInit({
  roomName: "HAXFOOTBALL",
  maxPlayers: 16,
  noPlayer: true,
  public: false,
  token: "thr1.AAAAAGEyo6J1ZLU6J03txw.xDqJmT27d3I",
});

room.onPlayerChat = (author, message) => {
  if (message === "hike") return snapInit(author);
  if (message === "fgset") return fieldGoalInit(author);
  if (message === "punt") return puntInit(author);
  if (message === "kickoff") return kickOffInit(author);
  if (message === "test") return testFunc(author);
  if (message === "swap") {
    game.swapOffense();
    resetBall();
  }
};

room.setTimeLimit(0);

let play = null;
let game = null;

const host = {
  isBotOn: true,
};

const MAP = {
  HIDDEN: 10000,
  HALF_FIELD: 775,
  YARD: 15.5,
  PLAYER_RADIUS: 15,
  BALL_RADIUS: 8.5,
  TOP_SIDELINE: -265,
  BOT_SIDELINE: 265,
  RED_SIDELINE: -930,
  BLUE_SIDELINE: 930,
  RED_ENDZONE: -775,
  BLUE_ENDZONE: 775,
  RED_SCORE_LINE: -1040,
  BLUE_SCORE_LINE: 1040,
  RED_FIELD_GOAL_LINE: -930,
  BLUE_FIELD_GOAL_LINE: 930,
  ABOVE_HASH: -110,
  BELOW_HASH: 110,
  TOP_HASH: -80,
  BOT_HASH: 80,
};

const getYardMessage = (yard) => {
  return yard === 0 ? `in the endzone` : `at the ${yard} yard line`;
};

const sendPlayMessage = (playObj) => {
  const {
    type,
    player1Name = "",
    player2Name = "",
    endYard = "",
    netYards = "",
    mapSection = "null",
  } = playObj;

  const endingMsg = getNetYardsMessage(netYards);
  const endYardMsg = getYardMessage(endYard);

  switch (type) {
    case "tackle":
      Chat.send(
        `${player2Name} tackled ${player1Name} ${endYardMsg} for ${endingMsg} | ${mapSection}`
      );
      break;
    case "catch":
      Chat.send(`${player1Name} caught the ball ${endYardMsg} | ${mapSection}`);
      break;
    case "pass deflection":
      Chat.send(`Pass Incomplete, deflected by ${player1Name}`);
      break;
    case "player out of bounds":
      Chat.send(
        `${player1Name} ran out of bounds ${endYardMsg} for ${endingMsg} | ${mapSection}`
      );
      break;
    case "caught out of bounds":
      Chat.send(`Pass Incomplete, caught out of bounds by ${player1Name}`);
      break;
    case "touchdown":
      Chat.send(`Touchdown scored by ${player1Name} for ${endingMsg} `);
  }
};

const getTeamFortyYardLinePosition = (team) => {
  return team === 1 ? MAP.YARD * -10 : MAP.YARD * 10;
};

const getPlayerDiscProperties = (id) => {
  // Flattened the native method because we only use speed and and position
  const { xpseed, yspeed, x, y } = room.getPlayerDiscProperties(id);
  return {
    position: { x, y },
    speed: { x: xpseed, y: yspeed },
  };
};

const flattenPlayer = ({ id, team, name }) => {
  return {
    id,
    team,
    name,
  };
};

const checkIfBehind = (team, p1, p2) => {
  console.log(team, p1, p2);
  return team === 1 ? p1.x < p2.x : p1.x > p2.x;
};

const Chat = {
  silenced: false,

  message(message, options = {}) {
    const {
      icon = "",
      info = "",
      id = null,
      color = null,
      style = null,
      sound = null,
    } = options;
    const str = [icon, info, message]
      .map((str) => (str.length > 0 ? str + " " : str))
      .join("")
      .trim();
    room.sendAnnouncement(str, id, color, style, sound);
  },

  setSilence(bool) {
    this.silenced = bool;
  },

  send(msg, options = {}) {
    this.message(msg, options);
  },

  sendSuccess(msg, options = {}) {
    options.icon = ICONS.GreenCheck;
    this.message(msg, options);
    return this;
  },

  sendNotification(msg, options = {}) {
    options.icon = ICONS.Bell;
    options.sound = 2;
    this.message(msg, options);
  },

  sendDM(msg, options = {}) {
    options.color = COLORS.Gray;
    this.message(msg, options);
    return this;
  },

  sendWarning(msg, options = {}) {
    options.icon = ICONS.RedTriangle;
    options.sound = 2;
    this.message(msg, options);
    return this;
  },

  sendBotError(msg, options = {}) {
    options.icon = ICONS.Construction;
    this.message(msg, options);
    return this;
  },

  sendCommandError(msg, options = {}) {
    options.icon = ICONS.Exclamation;
    options.color = COLORS.Green;
    this.message(msg, options);
    return this;
  },
};

room.setCustomStadium(HFL_MAP);
room.startGame();

room.onPlayerJoin = (player) => {
  room.setPlayerAdmin(player.id, true);
  room.setPlayerTeam(player.id, 1);
  room.setPlayerDiscProperties(player.id, { x: -150, y: 0 });
};

room.onPlayerTeamChange = () => {
  game.updateTeams();
};

room.onGameStart = () => {
  game = new Game();
};

var isKickOff = false;
var isFieldGoal = false;
var isPunt = false;
var isTwoPoint = false;
var isIntermission = false;
var isGame = false;
var canTwoPoint = false;

// Live Play
var quarterback = null; // Player who snapped the ball
var ballCarrier = null; // Player who has posession of the ball
var ballPosition;
var ballCarrierPosition;
var ballPositionOnKick;
var blitzClock;
var catchPositionX;

// Live Play Booleans
var ballSnapped = false;
var ballPassed = false;
var ballContact = false;
var ballCaught = false;
var ballBlitzed = false;
var ballLive = false;
var blitzAble = false;
var blitzed = false;
var ballRan = false;

const getOpposingTeamEndzone = (team) => {
  return team === 1 ? MAP.BLUE_ENDZONE : MAP.RED_ENDZONE;
};

const getTeamEndzone = (team) => {
  return team === 1 ? MAP.RED_ENDZONE : MAP.BLUE_ENDZONE;
};

class Game {
  static CONFIG = {
    YARDS_TO_GET: 20,
  };

  constructor() {
    this.state = {};
    this._los = {
      x: 0,
      y: 0,
    };
    this._down = {
      down: 1,
      yards: Game.CONFIG.YARDS_TO_GET,
    };

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

  setState(property, value = true) {
    const strProp = `_${property}`;
    this.state[strProp] = value;
    return this;
  }

  getState(property) {
    const strProp = `_${property}`;
    return this.state[strProp] ?? false;
  }

  getDownYards() {
    return this._down.yards;
  }

  getDownYardsStr() {
    return this._down.yards;
  }

  getDown() {
    return this._down.down;
  }

  getLOSYard() {
    return new DistanceCalculator(this.getLOS()).getInYards();
  }

  getLOSHalfStr() {
    const LOS = this.getLOS();
    if (LOS > 0) return "Blue ";
    if (LOS < 0) return "Red ";
    return "";
  }

  getDownStr() {
    const downStrings = {
      1: "1st",
      2: "2nd",
      3: "3rd",
      4: "4th",
      5: "5th",
    };
    return downStrings[this._down.down];
  }

  addDown() {
    this._down.down++;
    return this;
  }

  setDown(down) {
    this._down.down = down;
    return this;
  }

  setYards(yards) {
    this._down.yards = yards;
    return this;
  }

  subtractYards(yards) {
    this._down.yards -= yards;
    return this;
  }

  resetDownAndYards() {
    this._down.down = 1;
    this._down.yards = Game.CONFIG.YARDS_TO_GET;
  }

  #getTeamObjFromID(teamID) {
    return teamID === 1 ? this._red : this._blue;
  }

  getLivePlay() {
    return this._isLivePlay;
  }

  setLivePlay(bool) {
    this._isLivePlay = bool;
    return this;
  }

  updateTeams() {
    this._red.players = room.getPlayerList().filter(({ team }) => team === 1);
    this._blue.players = room.getPlayerList().filter(({ team }) => team === 2);
    this._fieldedPlayers = room
      .getPlayerList()
      .filter(({ team }) => team !== 0);
    return this;
  }

  getTeamPlayers() {
    return {
      red: this._red.players,
      blue: this._blue.players,
      fielded: this._fieldedPlayers,
    };
  }

  getOffenseDefensePlayers() {
    try {
      return {
        offensePlayers: this.#getTeamObjFromID(this.getOffenseTeam()).players,
        defensePlayers: this.#getTeamObjFromID(this.getDefenseTeam()).players,
      };
    } catch (error) {
      console.log(error);
      Chat.send("This cant be run when a play is not live!!!");
    }
  }

  getOffenseTeam() {
    return this._offenseTeamID;
  }

  setOffenseTeam(teamID) {
    this._offenseTeamID = teamID;
  }

  getDefenseTeam() {
    return this.getOffenseTeam() === 1 ? 2 : 1;
  }

  swapOffense() {
    const offense = this.getOffenseTeam();
    console.log(offense);
    if (offense === 1) {
      this.setOffenseTeam(2);
    } else {
      this.setOffenseTeam(1);
    }
    return this;
  }

  getScore() {
    return {
      red: this._red.score,
      blue: this._blue.score,
    };
  }

  setScore(teamID, score) {
    teamID === 1 ? this._red.score === score : this._blue.score === score;
    return this;
  }

  addScore(teamID, score) {
    teamID === 1 ? (this._red.score += score) : (this._blue.score += score);
    return this;
  }

  setLOS(x) {
    this._los.x = x;
    return this;
  }

  getLOS() {
    return this._los.x;
  }

  getLineToGain() {
    return new DistanceCalculator([
      this._los.x,
      MAP.YARD * Game.CONFIG.YARDS_TO_GET,
    ])
      .addByTeam(this.getOffenseTeam())
      .getDistance();
  }

  getSnapDistance() {
    return new DistanceCalculator([this._los.x, MAP.YARD * 5])
      .subtractByTeam(this.getOffenseTeam())
      .getDistance();
  }

  getSnapYard() {
    return new DistanceCalculator([this._los.x, MAP.YARD * 5])
      .subtractByTeam(this.getOffenseTeam())
      .getYardLine();
  }

  getLOSYard() {
    return new DistanceCalculator(this.getLOS()).getYardLine();
  }

  moveFieldMarkers() {
    const hideLineToGain =
      this.getLineToGain() <= MAP.RED_ENDZONE ||
      this.getLineToGain() >= MAP.BLUE_ENDZONE;
    const lineToGainX = hideLineToGain ? MAP.HIDDEN : this.getLineToGain();

    room.setDiscProperties(1, {
      x: this._los.x,
      y: MAP.TOP_SIDELINE,
    });
    room.setDiscProperties(2, {
      x: this._los.x,
      y: MAP.BOT_SIDELINE,
    });

    room.setDiscProperties(3, {
      x: lineToGainX,
      y: MAP.TOP_SIDELINE,
    });
    room.setDiscProperties(4, {
      x: lineToGainX,
      y: MAP.BOT_SIDELINE,
    });

    return this;
  }
}

function checkIfWithinHash(position, radius) {
  const { y } = position;
  const { topHash, botHash } = adjustMapCoordinatesForRadius(radius);

  return y > topHash && y < botHash;
}

function checkIfFieldGoalSuccessful() {
  const { x } = ball.getPosition();
  const { redFG, blueFG } = adjustMapCoordinatesForRadius(MAP.BALL_RADIUS);
  return game.getOffenseTeam() === 1 ? x > blueFG : x < redFG;
}

function checkIfBallIsMoving() {
  const BALL_DEAD_SPEED = 0.05;
  const { xspeed } = ball.getSpeed();

  // xpseed can be negative, so make sure you get absoltue value
  return Math.abs(xspeed) > BALL_DEAD_SPEED;
}

// Interface that easily allows for distance calculation, rounding, and conversion to yards
class DistanceCalculator {
  static adjustPosition(player) {
    const { team, id } = player;
    const {
      position: { x, y },
    } = getPlayerDiscProperties(id);

    return {
      x: new DistanceCalculator([x, MAP.PLAYER_RADIUS])
        .addByTeam(team)
        .getDistance(),
      y,
    };
  }

  // Remember 775 is the limit

  constructor(distance) {
    this._distance = distance;
  }

  getDistance() {
    return this._distance;
  }

  getInYards() {
    return this._distance / MAP.YARD;
  }

  getYardLine() {
    return (MAP.HALF_FIELD - Math.abs(this._distance)) / MAP.YARD;
  }

  addByTeam(team) {
    const [p1, p2] = this._distance;
    this._distance = team === 1 ? p1 + p2 : p1 - p2;
    return this;
  }

  subtractByTeam(team) {
    const [p1, p2] = this._distance;
    this._distance = team === 1 ? p1 - p2 : p1 + p2;
    return this;
  }

  calcDifference() {
    const [p1, p2] = this._distance;
    if (p1.x === undefined) {
      this._distance = Math.abs(p1 - p2);
      return this;
    }
    // If 2D points
    const d1 = p1.x - p2.x;
    const d2 = p1.y - p2.y;
    this._distance = Math.hypot(d1, d2);
    return this;
  }

  calcDifferenceByTeam(team) {
    const [p1, p2] = this._distance;
    const distance = p1 - p2;

    // We need to get the net difference, and that varies by team since net for blue is from positive to negative
    if (team === 1) {
      if (distance > 0) {
        this._distance = -distance;
      }
      if (distance < 0) {
        this._distance = Math.abs(distance);
      }
    } else {
      this._distance = distance;
    }

    return this;
  }

  roundByTeam(team) {
    const { YARD } = MAP;

    // Cant round to the endzone, we always round to 1 yard if the distance is between 0 and 1 yard line
    const endzone = getTeamEndzone(team);
    const oneYardLine = new DistanceCalculator([endzone, YARD])
      .addByTeam(team)
      .getDistance();

    if (team === 1) {
      this._distance =
        this._distance < oneYardLine && this._distance > endzone
          ? oneYardLine
          : YARD * Math.floor(this._distance / YARD);
    } else {
      this._distance =
        this._distance > oneYardLine && this._distance < endzone
          ? oneYardLine
          : YARD * Math.ceil(this._distance / YARD);
    }

    return this;
  }

  // In case the play ends in the endzone, we need to round to the endzone
  // because we dont care about the distance after the endzone
  roundToMap() {
    if (this._distance > MAP.BLUE_ENDZONE) {
      this._distance = MAP.BLUE_ENDZONE;
    }
    if (this._distance < MAP.RED_ENDZONE) {
      this._distance = MAP.RED_ENDZONE;
    }
    return this;
  }
}

const ball = {
  getPosition() {
    return room.getBallPosition();
  },

  getSpeed() {
    const { xspeed, yspeed } = room.getDiscProperties(0);
    return {
      xspeed,
      yspeed,
    };
  },

  setPosition(position) {
    const { x, y = 0 } = position;
    room.setDiscProperties(0, {
      x: x,
      y: y,
      xspeed: 0,
      yspeed: 0,
      ygravity: 0,
    });
    return this;
  },

  suppress() {
    room.setDiscProperties(0, {
      invMass: 0.000001,
      xspeed: 0,
      yspeed: 0,
    });
    return this;
  },

  release() {
    room.setDiscProperties(0, {
      invMass: 1,
      xspeed: 0,
      yspeed: 0,
    });
    return this;
  },

  score(team) {
    const x = team === 2 ? MAP.BLUE_SCORE_LINE : MAP.RED_SCORE_LINE;
    room.setDiscProperties(0, {
      x: x,
      y: -200,
      xspeed: 0,
      yspeed: 0,
      ygravity: 0.015,
      invMass: 0.000001,
    });
  },
};

room.onPositionsReset = () => {
  kickOffInit();
};

const sendDownAndDistance = () => {
  Chat.send(
    `${game.getDownStr()} & ${game.getDownYardsStr()} on ${game.getLOSHalfStr()}${game.getLOSYard()}`
  );
};

// Master Class for all plays
class Play {
  static validate(player) {
    return player.team === game.getOffenseTeam();
  }

  constructor() {
    this.time = "0:01";
    this.state = {};
  }

  // Sets true by default
  setState(property, value = true) {
    const strProp = `_${property}`;
    this.state[strProp] = value;
    return this;
  }

  getState(property) {
    const strProp = `_${property}`;
    return this.state[strProp] ?? false;
  }

  getBallCarrier() {
    return this._ballCarrier;
  }

  setBallCarrier(player) {
    this._ballCarrier = player;
    return this;
  }

  determineAndExecuteBallContact(ballContactObj) {
    const {
      player: { team },
    } = ballContactObj;

    return team === game.getOffenseTeam()
      ? this.handleBallContactSameTeam(ballContactObj)
      : this.handleBallContactOpposingTeam(ballContactObj);
  }

  getEndPlayData(rawPosition, team) {
    const { x } = rawPosition;

    // Either the LOS for snaps and field goals, or the catch position for punts and kickoffs
    const startingPosition = this.getStartingPosition();

    console.log(x);

    console.log(rawPosition);

    const { name: mapSection = null } =
      mapSections.getSection(rawPosition) ?? {};

    const roundedX = new DistanceCalculator([x, MAP.PLAYER_RADIUS])
      .addByTeam(team)
      .roundByTeam(team)
      .roundToMap();

    console.log(roundedX);
    // We dont need to round since we already did
    const netYards = new DistanceCalculator([
      startingPosition,
      roundedX.getDistance(),
    ])
      .calcDifferenceByTeam(team)
      .getInYards();

    const endYard = roundedX.getYardLine();

    return {
      mapSection,
      netYards,
      endPosition: roundedX.getDistance(),
      endYard,
    };
  }

  handleTouchdown() {
    const { name, team } = this.getBallCarrier();

    // Get what kind of touchdown

    Chat.send(`Touchdown scored by ${name}!`);

    ball.score(team);
  }

  handleSafety() {
    game.setLivePlay(false);
    Chat.send("SAFETY!!!");
    ball.score(game.getDefenseTeam());

    const offenseEndZone = getTeamEndzone(game.getOffenseTeam());
    const offenseTwentyYardLine = new DistanceCalculator([
      offenseEndZone,
      MAP.YARD * 20,
    ])
      .addByTeam(game.getOffenseTeam())
      .getDistance();
    game.setState("kickOffPosition", offenseTwentyYardLine);
  }

  end() {
    sendDownAndDistance();
  }

  score() {}
}

class Punt extends Play {
  constructor(kicker) {
    super();
    this._kicker = kicker;
    this._ballCarrier = null;
  }

  getKicker() {
    return this._kicker;
  }

  getStartingPosition() {
    return this.getState("catchPosition");
  }

  putOffenseInPosition() {
    return this;
  }

  putDefenseInPosition() {
    return this;
  }

  createInvisibleWallForDefense() {
    return this;
  }

  determineAndExecuteBallContact(ballContactObj) {
    // We have to do this check AGAIN because playerOnkick is not an event listener, but a native listener
    if (this.getState("puntCaught")) return;
    super.determineAndExecuteBallContact(ballContactObj);
  }

  handleBallDownedByKickingTeam(playerPosition, playerTeam) {
    // What if they down in the endzone? Check for safety?
    Chat.send("Ball downed by kicking team");

    const x = new DistanceCalculator(playerPosition.x)
      .roundByTeam(playerTeam)
      .getDistance();

    game.setLOS(x);

    resetBall();
  }

  handleBallContactSameTeam(ballContactObj) {
    const { type, player, playerPosition } = ballContactObj;
    const { name, id, team } = player;

    if (id !== this.getKicker().id)
      return this.handleBallDownedByKickingTeam(playerPosition);
    if (type === "touch") return;

    this.setState("puntKicked");
    return Chat.send(`Punt Kicked`);
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
      .roundByTeam();

    const yardOfCatch = adjustedX.getInYards();

    this.setState("catchPosition", adjustedX.getDistance());

    Chat.send(`Punt caught by ${name} @ the ${yardOfCatch}`);

    this.setState("puntCaught");

    this.setBallCarrier(player);
  }

  handleBallContactOpposingTeam(ballContactObj) {
    return this.handleCatch(ballContactObj);
  }

  handleBallOutOfBounds(ballPosition) {
    const { x } = ballPosition;
    const team = game.getDefenseTeam();

    const roundedX = new DistanceCalculator(x).roundByTeam(team);

    const yardLineAtOutOfBounds = roundedX.getYardLine();

    Chat.send(`Ball went out of bounds at the ${yardLineAtOutOfBounds}`);

    game.setLOS(roundedX.getDistance());

    game.swapOffense();

    resetBall();
  }

  handleBallCarrierOutOfBounds(ballCarrierPosition) {
    const { team, name } = this.getBallCarrier();

    const { netYards, endPosition, endYard, mapSection } = super.getEndPlayData(
      ballCarrierPosition,
      team
    );

    sendPlayMessage({
      type: "player out of bounds",
      player1Name: name,
      endYard: endYard,
      netYards: netYards,
      mapSection: mapSection,
    });

    game.setLOS(endPosition);

    resetBall();
  }

  handleBallCarrierContactOpposingTeam(contactObj) {
    const { player, playerPosition, ballCarrierPosition } = contactObj;
    const { team, name } = this.getBallCarrier();

    const { netYards, endPosition, endYard, mapSection } = super.getEndPlayData(
      ballCarrierPosition,
      team
    );

    game.setLOS(endPosition);

    console.log(this.getStartingPosition());

    sendPlayMessage({
      type: "tackle",
      player1Name: name,
      player2Name: player.name,
      endYard: endYard,
      netYards: netYards,
      mapSection: mapSection,
    });

    resetBall();
  }
}

class KickOff extends Punt {
  constructor(position) {
    super();
    this._kickOffPosition = position;
  }

  getKickOffPosition() {
    return this._kickOffPosition;
  }

  putBallInPosition() {
    ball.setPosition({ x: this._kickOffPosition });
    return this;
  }

  putOffenseInPosition() {
    return this;
  }

  putDefenseInPosition() {
    return this;
  }

  createInvisibleWallForDefense() {
    return this;
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
      .roundByTeam();

    const yardOfCatch = adjustedX.getInYards();

    this.setState("catchPosition", adjustedX.getDistance());

    Chat.send(`Kickoff caught by ${name} @ the ${yardOfCatch}`);

    this.setState("kickOffCaught");

    this.setBallCarrier(player);
  }

  determineAndExecuteBallContact(ballContactObj) {
    // We have to do this check AGAIN because playerOnkick is not an event listener, but a native listener
    if (this.getState("kickOffCaught")) return;
    super.determineAndExecuteBallContact(ballContactObj);
  }

  handleBallContactSameTeam(ballContactObj) {
    const { type, player, playerPosition } = ballContactObj;
    const { name, id, team } = player;

    if (this.getState("kickOffKicked"))
      return super.handleBallDownedByKickingTeam(playerPosition);
    if (type === "touch") return;

    this.setState("kickOffKicked");
    return Chat.send(`KICKOFF!`);
  }

  handleBallOutOfBounds(ballPosition) {
    const { x } = ballPosition;
    const team = game.getDefenseTeam();
    const teamFortyYardLinePosition = getTeamFortyYardLinePosition(team);

    const roundedX = new DistanceCalculator(x).roundByTeam(team);

    const yardLineAtOutOfBounds = roundedX.getYardLine();

    Chat.send(`Ball went out of bounds at the ${yardLineAtOutOfBounds}`);
    Chat.send("PENALTY!!! AUTOMATIC 40!");

    game.swapOffense();

    game.setLOS(teamFortyYardLinePosition);

    resetBall();
  }
}
class Snap extends Play {
  constructor(quarterback) {
    super();
    this._quarterback = quarterback;
    this._ballCarrier = quarterback;
  }

  getQuarterback() {
    return this._quarterback;
  }

  getStartingPosition() {
    return game.getLOS();
  }

  handleRun(contactObj) {
    const { player, playerPosition } = contactObj;

    Chat.send(`Run by ${player.name} at the ${Math.round(playerPosition.x)}`);

    this.setBallCarrier(player).setState("ballRan");
  }

  handleCatch(ballContactObj) {
    const { player, playerPosition } = ballContactObj;
    const { name } = player;

    const isOutOfBounds = checkIfOutOfBounds(playerPosition, MAP.PLAYER_RADIUS);
    if (isOutOfBounds) {
      Chat.send(`Pass Incomplete, caught out of bounds by ${name}`);
      return resetBall();
    }

    this.setState("ballCaught");

    const { name: mapSection = null } =
      mapSections.getSection(playerPosition) ?? {};

    Chat.send(`Pass caught by ${name} | ${mapSection}`);

    this.setBallCarrier(player);
  }

  handleBallContactOpposingTeam(ballContactObj) {
    if (this.getState("ballPassed") === false)
      return this.setState("ballBlitzed");

    const {
      type,
      player: { name, id },
      playerPosition,
    } = ballContactObj;

    const { name: mapSection = null } =
      mapSections.getSection(playerPosition) ?? {};

    sendPlayMessage({
      type: "pass deflection",
      player1Name: name,
      mapSection: mapSection,
    });

    resetBall();

    // Chat.send(`Ball Contact type: ${type} @ ${Math.round(x)} by ${name}`)
  }

  #handleIllegalTouch() {
    Chat.send("ILLEGAL TOUCH!");

    resetBall();
  }

  handleBallContactSameTeam(ballContactObj) {
    const { type, player, playerPosition } = ballContactObj;
    const { name, id } = player;

    if (
      this.getState("ballPassed") === false &&
      id !== this.getQuarterback().id
    )
      return this.#handleIllegalTouch();
    if (type === "touch" && id === this.getQuarterback().id) return;

    // A touch by the QB never happens, only kicks
    if (id === this.getQuarterback().id) {
      this.setState("ballPassed");
      return Chat.send(`Ball Passed!`);
    }

    return this.handleCatch(ballContactObj);
  }

  determineAndExecuteBallContact(ballContactObj) {
    // We have to do this check AGAIN because playerOnkick is not an event listener, but a native listener
    if (
      this.getState("ballCaught") ||
      this.getState("ballRan") ||
      this.getState("ballBlitzed")
    )
      return;
    super.determineAndExecuteBallContact(ballContactObj);
  }

  handleBallCarrierContactSameTeam(contactObj) {
    // If he touches

    const { player, playerPosition, ballCarrierPosition } = contactObj;
    // Verify that its a legal run

    const isBehindQuarterBack = checkIfBehind(
      player.team,
      playerPosition,
      ballCarrierPosition
    );

    if (isBehindQuarterBack) return this.handleRun(contactObj);
    if (!isBehindQuarterBack) Chat.send(`Illegal run!`);
    // Might need to adjust the player's position here, but for now, nahhh lmao

    resetBall();
  }

  handleBallCarrierContactOpposingTeam(contactObj) {
    const { player, playerPosition, ballCarrierPosition } = contactObj;
    const { team, name } = this.getBallCarrier();

    const { netYards, endPosition, endYard, mapSection } = super.getEndPlayData(
      ballCarrierPosition,
      team
    );

    game.setLOS(endPosition);

    sendPlayMessage({
      type: "tackle",
      player1Name: name,
      player2Name: player.name,
      endYard: endYard,
      netYards: netYards,
      mapSection: mapSection,
    });

    const isSafety = checkIfSafetyPlayer(ballCarrierPosition, team);

    console.log(isSafety);

    if (isSafety) return super.handleSafety();

    resetBall();
  }

  handleBallOutOfBounds(ballPosition) {
    const { x } = ballPosition;
    const { team } = this.getBallCarrier();

    const yardLineAtOutOfBounds = new DistanceCalculator(x)
      .roundByTeam(team)
      .getYardLine();

    Chat.send(`Ball went out of bounds at the ${yardLineAtOutOfBounds}`);

    const isSafety = checkIfSafetyBall(game.getOffenseTeam());
    if (isSafety) return super.handleSafety();

    resetBall();
  }

  handleBallCarrierOutOfBounds(ballCarrierPosition) {
    const { team, name } = this.getBallCarrier();

    const { netYards, endPosition, endYard, mapSection } = super.getEndPlayData(
      ballCarrierPosition,
      team
    );

    sendPlayMessage({
      type: "player out of bounds",
      player1Name: name,
      endYard: endYard,
      netYards: netYards,
      mapSection: mapSection,
    });

    const isSafety = checkIfSafetyPlayer(ballCarrierPosition, team);

    if (isSafety) return super.handleSafety();

    game.setLOS(endPosition);

    resetBall();
  }
}

class FieldGoal extends Play {
  constructor(kicker) {
    super();
    this._kicker = kicker;
    this._ballCarrier = kicker;
  }

  getKicker() {
    return this._kicker;
  }

  putKickerInPosition() {
    const { team, id } = this._kicker;
    const sevenYardsBehindBall = new DistanceCalculator([
      game.getSnapDistance(),
      MAP.YARD * 7,
    ])
      .subtractByTeam(team)
      .getDistance();
    room.setPlayerDiscProperties(id, {
      x: sevenYardsBehindBall,
      y: MAP.TOP_HASH,
    });

    return this;
  }

  putOffenseInPosition() {
    const { team } = this._kicker;
    const { offensePlayers } = game.getOffenseDefensePlayers();
    const opposingEndzone = getOpposingTeamEndzone(team);

    const fiveYardsBeforeEndzone = new DistanceCalculator([
      opposingEndzone,
      MAP.YARD * 5,
    ])
      .subtractByTeam(team)
      .getDistance();

    offensePlayers.forEach(({ id }) => {
      if (id === this.getBallCarrier().id) return;
      room.setPlayerDiscProperties(id, { x: fiveYardsBeforeEndzone });
    });

    return this;
  }

  putDefenseInPosition() {
    const team = game.getDefenseTeam();
    const { defensePlayers } = game.getOffenseDefensePlayers();
    const opposingEndzone = getOpposingTeamEndzone(game.getOffenseTeam());

    const oneYardInFrontOfEndzone = new DistanceCalculator([
      opposingEndzone,
      MAP.YARD * 1,
    ])
      .subtractByTeam(team)
      .getDistance();

    defensePlayers.forEach(({ id }) => {
      room.setPlayerDiscProperties(id, { x: oneYardInFrontOfEndzone });
    });

    return this;
  }

  getStartingPosition() {
    return game.getLOS();
  }

  handleSuccess() {
    Chat.send("FG IS GOOD!!!!");

    resetBall();
  }

  handleBallOutOfHashes() {
    Chat.send("BALL WENT OUT OF HASHES, NO GOOD!");

    resetBall();
  }

  handleRun(contactObj) {
    const { player, playerPosition } = contactObj;

    Chat.send(`Run by ${player.name} at the ${Math.round(playerPosition.x)}`);

    this.setBallCarrier(player).setState("ballRan");
  }

  determineAndExecuteBallContact(ballContactObj) {
    // We have to do this check AGAIN because playerOnkick is not an event listener, but a native listener

    if (this.getState("ballRan") || this.getState("fieldGoalBlitzed")) return;
    super.determineAndExecuteBallContact(ballContactObj);
  }

  handleBallCarrierContactSameTeam(contactObj) {
    // If he touches

    const { player, playerPosition, ballCarrierPosition } = contactObj;
    // Verify that its a legal run

    const isBehindQuarterBack = checkIfBehind(
      player.team,
      playerPosition,
      ballCarrierPosition
    );

    if (isBehindQuarterBack) return this.handleRun(contactObj);
    if (!isBehindQuarterBack) Chat.send(`Illegal run!`);
    // Might need to adjust the player's position here, but for now, nahhh lmao

    resetBall();
  }

  handleBallCarrierContactOpposingTeam(contactObj) {
    const { player, playerPosition, ballCarrierPosition } = contactObj;
    const { team, name } = this.getBallCarrier();

    const { netYards, endPosition, endYard, mapSection } = super.getEndPlayData(
      ballCarrierPosition,
      team
    );

    game.setLOS(endPosition);

    sendPlayMessage({
      type: "tackle",
      player1Name: name,
      player2Name: player.name,
      endYard: endYard,
      netYards: netYards,
      mapSection: mapSection,
    });

    resetBall();
  }

  handleBallCarrierOutOfBounds(ballCarrierPosition) {
    const { team, name } = this.getBallCarrier();

    const { netYards, endPosition, endYard } = super.getEndPlayData(
      ballCarrierPosition,
      team
    );

    sendPlayMessage({
      type: "player out of bounds",
      player1Name: name,
      endYard: endYard,
      netYards: netYards,
      mapSection: mapSection,
    });

    game.setLOS(endPosition);

    resetBall();
  }

  handleIncomplete(ballContactObj = "def") {
    console.log(ballContactObj);
    console.log(this);
    Chat.send(`Field Goal Incomplete!`);

    resetBall();
  }

  handleBallContactOpposingTeam(ballContactObj) {
    const {
      player: { name },
    } = ballContactObj;

    if (this.getState("fieldGoalKicked") === false)
      return this.setState("fieldGoalBlitzed");

    Chat.send(`Field Goal Touched by ${name} Auto Field Goal!`);

    resetBall();
  }

  handleBallContactSameTeam(ballContactObj) {
    const {
      type,
      player: { id, name },
    } = ballContactObj;

    // console.log(this.handleBallContactSameTeam.caller.name)

    console.log(ballContactObj);

    console.log(id, this.getKicker().id);

    console.log(this.getState("fieldGoalKicked"));

    if (id !== this.getKicker().id || this.getState("fieldGoalKicked"))
      return this.handleIncomplete("from handleBallContactSameTeam");
    if (type === "kick") return this.setState("fieldGoalKicked");
  }

  score() {}

  end() {}
}

const getNetYardsMessage = (netYards) => {
  if (netYards > 0) return `a gain of ${netYards}`;
  if (netYards < 0) return `a loss of ${Math.abs(netYards)}`;
  return ``;
};

const isInRectangleArea = ({ x1, y1, x2, y2 }, { x, y }) => {
  return x > x1 && x < x2 && y > y1 && y < y2;
};

/*
      O-----y1------O
      |             |
      x1			 x2
      |			 |
      O----y2------O
      */

const mapSections = {
  list: [
    {
      name: "Top Corner",
      getRectangleArea: function () {
        const { YARD, TOP_SIDELINE, ABOVE_HASH } = MAP;
        const LOSX = game.getLOS();

        const fifteenYardsInFrontOfLOS = LOSX + YARD * 15;
        const fifteenYardsBehindLOS = LOSX - YARD * 15;

        return {
          x1: fifteenYardsBehindLOS,
          y1: TOP_SIDELINE,
          x2: fifteenYardsInFrontOfLOS,
          y2: ABOVE_HASH,
        };
      },
    },
    {
      name: "Bottom Corner",
      getRectangleArea: function () {
        const { YARD, BOT_SIDELINE, BELOW_HASH } = MAP;
        const LOSX = game.getLOS();

        const fifteenYardsInFrontOfLOS = LOSX + YARD * 15;
        const fifteenYardsBehindLOS = LOSX - YARD * 15;

        return {
          x1: fifteenYardsBehindLOS,
          y1: BELOW_HASH,
          x2: fifteenYardsInFrontOfLOS,
          y2: BOT_SIDELINE,
        };
      },
    },
    {
      name: "Middle",
      getRectangleArea: function () {
        const { YARD, ABOVE_HASH, BELOW_HASH } = MAP;
        const LOSX = game.getLOS();

        const fifteenYardsInFrontOfLOS = LOSX + YARD * 15;
        const fifteenYardsBehindLOS = LOSX - YARD * 15;

        return {
          x1: fifteenYardsBehindLOS,
          y1: ABOVE_HASH,
          x2: fifteenYardsInFrontOfLOS,
          y2: BELOW_HASH,
        };
      },
    },
    {
      name: "Deep",
      getRectangleArea: function () {
        const { YARD, BOT_SIDELINE, TOP_SIDELINE, BLUE_SIDELINE } = MAP;
        const LOSX = game.getLOS();
        const fifteenYardsInFrontOfLOS = LOSX + YARD * 15;

        return {
          x1: fifteenYardsInFrontOfLOS,
          y1: TOP_SIDELINE,
          x2: BLUE_SIDELINE,
          y2: BOT_SIDELINE,
        };
      },
    },
  ],

  getSection(position) {
    return this.list.find((section) => {
      const rectangleArea = section.getRectangleArea();
      console.log(rectangleArea);
      console.log(position);
      return isInRectangleArea(rectangleArea, position);
    });
  },
};

const adjustMapCoordinatesForRadius = (objectRadius) => {
  const {
    TOP_SIDELINE,
    BOT_SIDELINE,
    RED_SIDELINE,
    BLUE_SIDELINE,
    TOP_HASH,
    BOT_HASH,
    RED_FIELD_GOAL_LINE,
    BLUE_FIELD_GOAL_LINE,
  } = MAP;

  return {
    topSideLine: TOP_SIDELINE + objectRadius,
    botSideLine: BOT_SIDELINE - objectRadius,
    redSideLine: RED_SIDELINE + objectRadius,
    blueSideLine: BLUE_SIDELINE - objectRadius,
    topHash: TOP_HASH + objectRadius,
    botHash: BOT_HASH - objectRadius,
    redFG: RED_FIELD_GOAL_LINE - objectRadius,
    blueFG: BLUE_FIELD_GOAL_LINE + objectRadius,
  };
};

// Also returns the endzone the player is in
const checkIfPlayerInEndZone = (player) => {
  const { x } = DistanceCalculator.adjustPosition(player);
  return checkIfInEndzone(x);
};

const checkIfInEndzone = (x) => {
  const { RED_ENDZONE, BLUE_ENDZONE } = MAP;

  if (x <= RED_ENDZONE) return 1;
  if (x >= BLUE_ENDZONE) return 2;
  return null;
};

const checkIfTouchdown = (player) => {
  const endZone = checkIfPlayerInEndZone(player);
  return endZone && endZone !== player.team;
};

const checkIfOutOfBounds = (objectToCheck, objectRadius) => {
  const { x, y } = objectToCheck;
  // Adjust for Ball Radius
  const { topSideLine, botSideLine, redSideLine, blueSideLine } =
    adjustMapCoordinatesForRadius(objectRadius);
  return (
    y < topSideLine || y > botSideLine || x < redSideLine || x > blueSideLine
  );
};

const checkIfBallOutOfBounds = () => {
  const ballPosition = ball.getPosition();
  const isOutOfBounds = checkIfOutOfBounds(ballPosition, MAP.BALL_RADIUS);
  return isOutOfBounds ? ballPosition : null;
};

const checkIfSafetyPlayer = (position, team) => {
  const adjustedPos = new DistanceCalculator([position.x, MAP.PLAYER_RADIUS])
    .addByTeam(team)
    .getDistance();

  const inEndzone = checkIfInEndzone(adjustedPos);
  return inEndzone;
};

const checkIfSafetyBall = (team) => {
  const ballPosition = ball.getPosition();

  return checkIfInEndzone(ballPosition) === team;
};

const checkIfPlayerOutOfBounds = (player) => {
  // We have to adjust the player position
  const { position } = getPlayerDiscProperties(player.id);
  const isOutOfBounds = checkIfOutOfBounds(position, MAP.PLAYER_RADIUS);
  return isOutOfBounds ? position : null;
};

// Coordinate distance between two points

room.onPlayerBallKick = (player) => {
  if (game.getLivePlay() === false || play === null) return;

  const { position } = player;
  const ballContact = new BallContact("kick", player, position);

  play.determineAndExecuteBallContact(ballContact);
};

class BallContact {
  constructor(contactType, player, playerPosition) {
    this.type = contactType; // Either touch or kick
    this.player = flattenPlayer(player);
    this.playerPosition = playerPosition;
  }
}

class PlayerContact {
  constructor(player, playerPosition, ballCarrierPosition) {
    this.player = flattenPlayer(player);
    this.playerPosition = playerPosition;
    this.ballCarrierPosition = ballCarrierPosition;
  }
}

const checkBallContact = () => {
  const TOUCHING_DISTANCE = MAP.BALL_RADIUS + MAP.PLAYER_RADIUS + 0.01;
  const ballPosition = ball.getPosition();
  const { fielded } = game.getTeamPlayers();

  for (const player of fielded) {
    const { id } = player;
    const { position: playerPosition } = getPlayerDiscProperties(id);

    const distanceToBall = new DistanceCalculator([
      playerPosition,
      ballPosition,
    ])
      .calcDifference()
      .getDistance();

    if (distanceToBall < TOUCHING_DISTANCE)
      return new BallContact("touch", player, playerPosition);
  }

  return null;
};

// This function takes an array of players as a parameter to allow for this function to be used for both runs and tackles
const checkBallCarrierContact = (playerArray) => {
  // Player array will never include the ballcarrier, we will filter him out
  const TOUCHING_DISTANCE = MAP.PLAYER_RADIUS * 2 + 1;
  const ballCarrier = play.getBallCarrier();
  const { position: ballCarrierPosition } = getPlayerDiscProperties(
    ballCarrier.id
  );

  for (const player of playerArray) {
    const { id } = player;
    if (id === ballCarrier.id) continue;
    const { position: playerPosition, speed: playerSpeed } =
      getPlayerDiscProperties(id);

    const distanceToBallCarrier = new DistanceCalculator([
      playerPosition,
      ballCarrierPosition,
    ])
      .calcDifference()
      .getDistance();

    if (distanceToBallCarrier < TOUCHING_DISTANCE)
      return new PlayerContact(player, playerPosition, ballCarrierPosition);
  }

  return null;
};

const resetBall = () => {
  const playerSet = new DistanceCalculator([
    game.getSnapDistance(),
    MAP.YARD * 5,
  ])
    .subtractByTeam(game.getOffenseTeam())
    .getDistance();
  room.setPlayerDiscProperties(play?.getBallCarrier()?.id, {
    x: playerSet,
    y: 0,
  });
  ball.setPosition({ x: game.getSnapDistance(), y: 0 }).suppress();

  play = null;

  game.setLivePlay(false).moveFieldMarkers();
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

const EventListeners = [
  {
    // Done
    // Pass Incompletes, Punts/Kickoffs Out Of Bounds
    name: "Ball Out Of Bounds",
    runWhen: ["snap", "punt", "kickOff"],
    stopWhen: ["ballCaught", "ballRan", "puntCaught", "kickOffCaught"],
    func: () => {
      const ballOutOfBounds = checkIfBallOutOfBounds(); // This returns either null or the ballPosition,
      if (ballOutOfBounds !== null)
        return play.handleBallOutOfBounds(ballOutOfBounds);
    },
  },
  {
    // Field Goal Out Of Hashes, Field Goal Successful
    name: "Ball Field Goal",
    runWhen: ["fieldGoal"],
    stopWhen: ["fieldGoalBlitzed", "ballRan"],
    func: function () {
      // Here we check if the ball is within the hashes,
      // Check if the ball has enough speed to even reach the field goal posts
      // Check if the ball went through the posts
      const withinHash = checkIfWithinHash(ball.getPosition(), MAP.BALL_RADIUS);
      if (!withinHash) return play.handleBallOutOfHashes();
      const successfulFieldGoal = checkIfFieldGoalSuccessful();
      if (successfulFieldGoal) return play.handleSuccess();

      if (play.getState("fieldGoalKicked")) {
        const ballMoving = checkIfBallIsMoving();
        if (!ballMoving) return play.handleIncomplete("FROM EVENT LISTENER");
      }
    },
  },
  {
    // Done
    // Catches, Pass Deflections, Field Goal Incomplete, Field Goal Auto, DownedBall, Punt Catch, Kickoff Catch
    name: "Ball Contact",
    runWhen: ["all"],
    stopWhen: [
      "ballCaught",
      "ballRan",
      "ballBlitzed",
      "fieldGoalBlitzed",
      "puntCaught",
      "kickOffCaught",
    ],
    func: () => {
      const ballContact = checkBallContact();
      if (ballContact !== null)
        return play.determineAndExecuteBallContact(ballContact);
    },
  },
  {
    // Player Out Of Bounds and Player Touchdowns
    name: "BallCarrier Position Tracker",
    runWhen: ["snap", "fieldGoal", "puntCaught", "kickOffCaught"],
    stopWhen: ["fieldGoalKicked"],
    func: function () {
      const ballCarrier = play.getBallCarrier();
      const ballCarrierOutOfBounds = checkIfPlayerOutOfBounds(ballCarrier);
      const isTouchdown = checkIfTouchdown(ballCarrier);
      if (ballCarrierOutOfBounds)
        return play.handleBallCarrierOutOfBounds(ballCarrierOutOfBounds);
      if (isTouchdown) return play.handleTouchdown();
    },
  },
  {
    // Tackles, Sacks, Fumbles
    name: "BallCarrier Player Contact Opposing Team",
    runWhen: ["snap", "fieldGoal", "puntCaught", "kickOffCaught"],
    stopWhen: ["ballIntercepted"],
    func: () => {
      // Here we get the defensive team, and use as an argument to the function
      const { defensePlayers } = game.getOffenseDefensePlayers();
      if (defensePlayers.length === 0) return;
      const playerContact = checkBallCarrierContact(defensePlayers);
      if (playerContact !== null)
        return play.handleBallCarrierContactOpposingTeam(playerContact);
    },
  },
  {
    // Runs
    name: "BallCarrier Player Contact Same Team",
    runWhen: ["snap", "fieldGoal"],
    stopWhen: ["ballRan", "ballCaught", "ballIntercepted"],
    func: () => {
      // Here we get the offensive team, filter out the QB, and use as an argument to the function
      const { offensePlayers } = game.getOffenseDefensePlayers();
      const playerContact = checkBallCarrierContact(offensePlayers);
      if (playerContact !== null)
        return play.handleBallCarrierContactSameTeam(playerContact);
    },
  },
  {
    // Early Blitz Penalty
    name: "Defense Position",
    runWhen: ["all"],
    stopWhen: [],
    func: () => {},
  },
  {
    // Early LOS Cross Penalty
    name: "Quarterback Position",
    runWhen: ["all"],
    stopWhen: [],
    func: () => {},
  },
  {
    // Kick Drag Pass, FG, Punt, Kickoff
    name: "Kick Drag",
    runWhen: ["all"],
    stopWhen: [],
    func: () => {
      // Each Play has a this.MAX_DRAG_DISTANCE
    },
  },
];

const checkIfRunListener = (listenerObj) => {
  return listenerObj.runWhen.some(
    (state) => state === "all" || play.getState(state)
  );
};

const checkIfStopListener = (listenerObj) => {
  return listenerObj.stopWhen.some((state) => play.getState(state));
};

room.onGameTick = () => {
  // Run Event.runListeners()
  EventListeners.forEach((listenerObj) => {
    if (game === null || game.getLivePlay() === false) return;
    if (checkIfRunListener(listenerObj) === false) return null;
    if (checkIfStopListener(listenerObj) === true) return null;
    listenerObj.func();
  });
};

const quickPause = () => {
  room.pauseGame(true);
  room.pauseGame(false);
};

function fieldGoalInit(player) {
  // quickPause()

  play = new FieldGoal(player);

  console.log(play);

  ball.release();

  play
    .setState("fieldGoal")
    .putKickerInPosition()
    .putOffenseInPosition()
    .putDefenseInPosition();

  game.setLivePlay(true);

  Chat.send(`Field Goal Set`);
}

function snapInit(player) {
  const valid = Play.validate(player);
  if (!valid) return Chat.send("You are not on offense!");

  play = new Snap(player);

  play.validate;

  play.setState("snap");

  Chat.send(`Ball is hiked!`);

  ball.release();

  game.setLivePlay(true);
}

function puntInit(player) {
  const valid = Play.validate(player);
  if (!valid) return Chat.send("You are not on offense!");

  play = new Punt(player);

  play
    .setState("punt")
    .putOffenseInPosition()
    .putDefenseInPosition()
    .createInvisibleWallForDefense();

  Chat.send(`Ball punted!`);

  ball.release();

  game.setLivePlay(true);
}

function kickOffInit() {
  const kickOffPosition = game.getState("kickOffPosition")
    ? game.getState("kickOffPosition")
    : 0;

  play = new KickOff(kickOffPosition);

  play
    .setState("kickOff")
    .putBallInPosition()
    .putOffenseInPosition()
    .putDefenseInPosition()
    .createInvisibleWallForDefense();

  Chat.send(`KICKOFF`);

  ball.release();

  game.setLivePlay(true);
}

const testFunc = (player) => {
  console.log("Test Ran");

  console.log(play);
  console.log(game);

  console.log(room.getDiscProperties(0));

  console.log(ball.getSpeed());

  return;
};
