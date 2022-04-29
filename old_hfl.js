const GAME_CONFIG = {
  SCORE_LIMIT: 0,
  TIME_LIMIT: 0,
};

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

class Play {
  constructor(time) {
    this._time = Math.round(time);
    this._ballPositionOnSet = {};
    this._state = {};
  }

  // Sets true by default
  setState(property, value = true) {
    this._state[`_${property}`] = value;
    return this;
  }

  getState(property) {
    return this._state[`_${property}`] ?? false;
  }

  getBallCarrier() {
    return this._ballCarrier;
  }

  setBallCarrier(player) {
    this._ballCarrier = player;
    return this;
  }

  getBallPositionOnSet() {
    return this._ballPositionOnSet;
  }

  setBallPositionOnSet(position) {
    this._ballPositionOnSet = position;
    return this;
  }

  reset() {
    Chat.send("RESET RAN");
  }

  positionBallAndFieldMarkers() {
    ball.setPosition({ x: down.getSnapDistance() });
    down.moveFieldMarkers();
    return this;
  }

  getPlayData(rawPosition, team) {
    const { x } = rawPosition;

    // Either the LOS for snaps and field goals, or the catch position for punts and kickoffs
    const startingPosition = this.getStartingPosition();
    const mapSection = new MapSection(rawPosition).getSectionName();

    const roundedX = new DistanceCalculator([x, MAP.PLAYER_RADIUS])
      .addByTeam(team)
      .roundByTeam(team)
      .roundToMap();
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

  onTouchdown() {
    const { name, team } = this.getBallCarrier();

    if (this.getState("twoPoint") === false) {
      Chat.send("yup");
      down.setState("canTwoPoint");
    }

    // Get what kind of touchdown for stats

    const endzone = getOpposingTeamEndzone(team);
    const { netYards } = this.getPlayData({ x: endzone }, team);

    sendPlayMessage({
      type: PLAY_TYPES.TOUCHDOWN,
      playerName: name,
      netYards: netYards,
    });

    game.setLivePlay(false);

    return this.getState("twoPoint")
      ? this.scorePlay(2, game.getOffenseTeam())
      : this.scorePlay(7, game.getOffenseTeam());
  }

  handleSafety() {
    sendPlayMessage({ type: PLAY_TYPES.SAFETY });

    const offenseEndZone = getTeamEndzone(game.getOffenseTeam());
    const offenseTwentyYardLine = new DistanceCalculator([
      offenseEndZone,
      MAP.YARD * 20,
    ])
      .addByTeam(game.getOffenseTeam())
      .getDistance();

    // ? Why is offense scoring? Because we need the defense to get the ball, so offense has to kickoff
    this.scorePlay(2, game.getDefenseTeam(), game.getOffenseTeam());

    // Score the play first, so we can create a new down
    down.setState("safetyKickOff", offenseTwentyYardLine);
  }

  resetAfterDown() {
    sendDownAndDistance();
    setPlayers();
    // Sets the players too
    play = null;
    setBallAndFieldMarkersPlayEnd();
  }

  scorePlay(score, team, teamEndZoneToScore = team) {
    game.setLivePlay(false);

    game.addScore(team, score);
    ball.score(teamEndZoneToScore);
    sendScoreBoard();

    // Dont swap offense, we swap offense on the kickoff
  }

  endPlay({ netYards = 0, endPosition = null, addDown = true }) {
    console.log(netYards, endPosition, addDown);

    // const isKickOffOrPunt = this.getState("punt") || this.getState("kickOff")

    const updateDown = () => {
      console.log("UPDATE DOWN RAN");
      // Dont update the down if nothing happened, like off a pass deflection or on a punt and kickoff
      if (endPosition === null) return;

      const addYardsAndStartNewDownIfNecessary = () => {
        down.setLOS(endPosition);
        down.subtractYards(netYards);

        const currentYardsToGet = down.getYards();

        if (currentYardsToGet <= 0) {
          Chat.send("FIRST DOWN!");
          down.startNew();
        } else if (play.getState("fieldGoal")) {
          // This endplay only runs when there is a running play on the field goal
          Chat.send(`${ICONS.Loudspeaker} Turnover on downs FIELD GOAL!`);
          game.swapOffense();
          down.startNew();
        }
      };

      addYardsAndStartNewDownIfNecessary();
    };

    const enforceDown = () => {
      const currentDown = down.getDown();
      // if (currentDown === 4) {
      //   Chat.send(`4th down, GFI or PUNT`);
      // }
      if (currentDown === 5) {
        Chat.send(`${ICONS.Loudspeaker} Turnover on downs!`);
        game.swapOffense();
        down.startNew();
      }
    };

    game.setLivePlay(false);

    if (addDown) {
      down.addDown();
    }

    updateDown();

    enforceDown();

    this.resetAfterDown();
  }
}

class Snap extends Play {
  constructor(time, quarterback) {
    super(time);
    this._quarterback = quarterback;
    this._ballCarrier = quarterback;
  }

  getQuarterback() {
    return this._quarterback;
  }

  getStartingPosition() {
    return down.getLOS();
  }

  checkForPenalties() {
    const snapOutOfBoundsCheck = () => {
      const { position } = getPlayerDiscProperties(this._quarterback.id);
      const isOutOfBounds = checkIfOutOfBounds(position, MAP.PLAYER_RADIUS);
      return isOutOfBounds ? { type: PENALTY_TYPES.SNAP_OUT_OF_BOUNDS } : null;
    };

    const snapOutsideHashesCheck = () => {
      const { position } = getPlayerDiscProperties(this._quarterback.id);
      const withinHash = checkIfWithinHash(position, MAP.PLAYER_RADIUS);
      return withinHash ? null : { type: PENALTY_TYPES.SNAP_OUT_OF_HASHES };
    };

    const checkOffsideOffense = () => {
      const { offensePlayers } = game.getOffenseDefensePlayers();
      const offensiveTeam = game.getOffenseTeam();
      const offsidePlayer = getOffsidePlayer(offensePlayers, offensiveTeam);
      return Boolean(offsidePlayer)
        ? {
            type: PENALTY_TYPES.OFFSIDES_OFFENSE,
            playerName: offsidePlayer.name,
          }
        : null;
    };

    const checkOffsideDefense = () => {
      const { defensePlayers } = game.getOffenseDefensePlayers();
      const defensiveTeam = game.getDefenseTeam();
      const offsidePlayer = getOffsidePlayer(defensePlayers, defensiveTeam);
      return Boolean(offsidePlayer)
        ? {
            type: PENALTY_TYPES.OFFSIDES_DEFENSE,
            playerName: offsidePlayer.name,
          }
        : null;
    };

    // Put it in an array so we can control the order of the functions
    const penaltyArray = [
      snapOutOfBoundsCheck(),
      snapOutsideHashesCheck(),
      checkOffsideOffense(),
      checkOffsideDefense(),
    ];

    const penaltyObj = penaltyArray.find(
      (penalty) => Boolean(penalty) === true
    );

    if (Boolean(penaltyObj)) {
      handlePenalty(penaltyObj);
      return true;
    }
    return false;
  }

  onBallContact(ballContactObj) {
    // We have to do this check AGAIN because playerOnkick is not an event listener, but a native listener
    if (
      this.getState("ballCaught") ||
      this.getState("ballRan") ||
      this.getState("ballBlitzed")
    )
      return;
    super.onBallContact(ballContactObj);
  }

  onPlayerContactOffense(contactObj) {
    const {
      player,
      playerPosition,
      playerSpeed,
      ballCarrierPosition,
      ballCarrierSpeed,
    } = contactObj;
    // Verify that its a legal run

    // fumbleCheck(playerSpeed, ballCarrierSpeed)

    // Chat.send(`X: ${playerSpeed.x.toFixed(3)} Y: ${playerSpeed.y.toFixed(3)} || X: ${ballCarrierSpeed.x.toFixed(3)} Y: ${ballCarrierSpeed.y.toFixed(3)}`)
    // Chat.send(`TOTAL: ${(Math.abs(playerSpeed.x) + Math.abs(playerSpeed.y) + Math.abs(ballCarrierSpeed.x) + Math.abs(ballCarrierSpeed.y)).toFixed(3)}`)

    const isBehindQuarterBack = checkIfBehind(
      playerPosition.x,
      ballCarrierPosition.x,
      player.team
    );

    if (isBehindQuarterBack) return this.handleRun(contactObj);

    handlePenalty({
      type: PENALTY_TYPES.ILLEGAL_RUN,
      playerName: player.name,
    });

    // Might need to adjust the player's position here, but for now, nahhh lmao
  }

  onPlayerContactDefense(contactObj) {
    const { player, playerPosition, ballCarrierPosition } = contactObj;
    const { team, name } = this.getBallCarrier();

    const { netYards, endPosition, endYard, mapSection } = super.getPlayData(
      ballCarrierPosition,
      team
    );

    const isSack = checkIfBehind(endPosition, down.getLOS(), team);

    sendPlayMessage({
      type: isSack ? PLAY_TYPES.SACK : PLAY_TYPES.TACKLE,
      playerName: name,
      player2Name: player.name,
      yard: endYard,
      netYards: netYards,
      mapSection: mapSection,
      position: endPosition,
    });

    maybeSendQuoteMessage(player.name, netYards);

    const isSafety = checkIfSafetyPlayer(ballCarrierPosition, team);

    if (isSafety) return super.handleSafety();

    this.endPlay({ netYards: netYards, endPosition: endPosition });
  }

  onBallOutOfBounds(ballPosition) {
    const { x } = ballPosition;
    const { team } = this.getQuarterback();

    const rounded = new DistanceCalculator(x).roundByTeam(team);

    const endYard = rounded.getYardLine();
    const endPosition = rounded.getDistance();

    sendPlayMessage({
      type: PLAY_TYPES.PASS_OUT_OF_BOUNDS,
      yard: endYard,
      position: endPosition,
    });

    const isSafety = checkIfSafetyBall(x, team);
    if (isSafety) return super.handleSafety();

    this.endPlay({ netYards: 0 });
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

    if (isSafety) return super.handleSafety();

    this.endPlay({ netYards: netYards, endPosition: endPosition });
  }

  onKickDrag(dragAmount) {
    handlePenalty({
      type: PENALTY_TYPES.SNAP_DRAG,
      playerName: this._quarterback.name,
    });
  }

  handleRun(contactObj) {
    const { player, playerPosition } = contactObj;

    sendPlayMessage({ type: PLAY_TYPES.RUN, playerName: player.name });

    this.setBallCarrier(player).setState("ballRan");
  }

  handleCatch(ballContactObj) {
    const { player, playerPosition } = ballContactObj;
    const { name, team } = player;

    const adjustedX = new DistanceCalculator([
      playerPosition.x,
      MAP.PLAYER_RADIUS,
    ])
      .addByTeam(team)
      .roundByTeam()
      .roundToMap();

    const isOutOfBounds = checkIfOutOfBounds(playerPosition, MAP.PLAYER_RADIUS);
    if (isOutOfBounds) {
      sendPlayMessage({
        type: PLAY_TYPES.CATCH_OUT_OF_BOUNDS,
        playerName: name,
        yard: adjustedX.getYardLine(),
        position: adjustedX.getDistance(),
      });
      return this.endPlay({ netYards: 0 });
    }

    this.setState("ballCaught");

    const mapSection = new MapSection(playerPosition).getSectionName();

    sendPlayMessage({
      type: PLAY_TYPES.PASS_CATCH,
      playerName: name,
      yard: adjustedX.getYardLine(),
      mapSection: mapSection,
      position: adjustedX.getDistance(),
    });

    this.setBallCarrier(player);
  }

  handleIllegalCrossOffense() {
    handlePenalty({
      type: PENALTY_TYPES.ILLEGAL_LOS_CROSS,
      playerName: this._quarterback.name,
    });
  }

  handleBallContactOffense(ballContactObj) {
    const { type, player, playerPosition } = ballContactObj;
    const { name, id } = player;

    if (
      this.getState("ballPassed") === false &&
      id !== this.getQuarterback().id
    )
      return this.#handleIllegalTouch(name);
    if (type === BALL_CONTACT_TYPES.TOUCH && id === this.getQuarterback().id)
      return;

    // A touch by the QB never happens, only kicks
    if (id === this.getQuarterback().id) {
      this.setState("ballPassed");
      this.setBallCarrier(null);
      return;
    }

    return this.handleCatch(ballContactObj);
  }

  handleBallContactDefense(ballContactObj) {
    if (this.getState("ballPassed") === false)
      return this.setState("ballBlitzed");

    const {
      type,
      player: { name, id },
      playerPosition,
    } = ballContactObj;

    const mapSection = new MapSection(playerPosition).getSectionName();

    sendPlayMessage({ type: PLAY_TYPES.PASS_DEFLECTION, playerName: name });

    maybeSendQuoteMessage(name, 0);

    this.endPlay({ netYards: 0 });
  }

  #handleIllegalTouch(playerName) {
    handlePenalty({ type: PENALTY_TYPES.ILLEGAL_PASS, playerName: playerName });
  }

  handleAutoTouchdown() {
    // After three redzone penalties

    Chat.send(`AUTO TOUCHDOWN!`);

    this.scorePlay(7, game.getOffenseTeam());
  }
}

class TwoPoint extends Snap {
  constructor(time, quarterback) {
    super(time, quarterback);
  }
}

const PENALTY_TYPES = {
  SNAP_OUT_OF_HASHES: "Snap Out Of Hashes",
  SNAP_OUT_OF_BOUNDS: "Snap Out Of Bounds",
  DOUBLE_HIKE: "Double Hike",
  OFFSIDES_OFFENSE: "Offsides Offense",
  OFFSIDES_DEFENSE: "Offsides Defense",
  SNAP_DRAG: "Snap Drag",
  FG_DRAG: "Field Goal Drag",
  PUNT_DRAG: "Punt Drag",
  KICKOFF_DRAG: "Kickoff Drag",
  KICKOFF_DRAG_SAFETY: "Kickoff Drag Safety",
  KICKOFF_OUT_OF_BOUNDS: "Kick Off Out Of Bounds",
  KICKOFF_OUT_OF_BOUNDS_SAFETY: "Kick Off Out Of Bounds Safety",
  KICKOFF_OFFSIDES: "Kick Off Offsides Offense",
  KICKOFF_OFFSIDES_SAFETY: "Kick Off Offsides Offense Safety",
  ILLEGAL_PASS: "Illegal Pass",
  ILLEGAL_RUN: "Illegal Run",
  ILLEGAL_LOS_CROSS: "Illegal LOS Cross",
  ILLEGAL_BLITZ: "Illegal Blitz",
};

const handlePenalty = (penaltyObj) => {
  quickPause();
  game.setLivePlay(false);

  const { type, playerName = "" } = penaltyObj;

  const { time } = room.getScores();

  const PENALTIES = [
    {
      name: PENALTY_TYPES.SNAP_OUT_OF_HASHES,
      description: `Illegal Snap, Out Of Hashes, automatic loss of down`,
      netYards: 0,
      addDown: true,
    },
    {
      name: PENALTY_TYPES.SNAP_OUT_OF_BOUNDS,
      description: `Illegal Snap, Out of Bounds, automatic loss of down`,
      netYards: 0,
      addDown: true,
    },
    {
      name: PENALTY_TYPES.DOUBLE_HIKE,
      description: `Double Hike`,
      netYards: 0,
      addDown: true,
    },
    {
      name: PENALTY_TYPES.OFFSIDES_OFFENSE,
      description: `Offsides Offense ${playerName}, 10 yard penalty, repeat the down`,
      netYards: -10,
      addDown: false,
    },
    {
      name: PENALTY_TYPES.OFFSIDES_DEFENSE,
      description: `Offsides Defense ${playerName}, 10 yard penalty, repeat the down`,
      netYards: 10,
      addDown: false,
    },
    {
      name: PENALTY_TYPES.SNAP_DRAG,
      description: `Quarterback Drag, automatic loss of down`,
      netYards: 0,
      addDown: true,
    },
    {
      name: PENALTY_TYPES.FG_DRAG,
      description: `Field Goal Kick Drag, automatic loss of down`,
      netYards: 0,
      addDown: true,
    },
    {
      name: PENALTY_TYPES.PUNT_DRAG,
      description: `Punt Kick Drag, 10 yard penalty, repeat the down`,
      netYards: -10,
      addDown: false,
    },
    {
      name: PENALTY_TYPES.ILLEGAL_PASS,
      description: `Illegal touching of the ball by ${playerName}, automatic loss of down`,
      netYards: 0,
      addDown: true,
    },
    {
      name: PENALTY_TYPES.ILLEGAL_RUN,
      description: `Illegal run by ${playerName}, automatic loss of down`,
      netYards: 0,
      addDown: true,
    },
    {
      name: PENALTY_TYPES.ILLEGAL_LOS_CROSS,
      description: `${playerName} illegally crossed the line of scrimmage, automatic loss of down`,
      netYards: 0,
      addDown: true,
    },
    {
      // To plural
      name: PENALTY_TYPES.ILLEGAL_BLITZ,
      description: `Illegal blitz by ${playerName} at ${Math.round(
        time
      )} seconds, 10 yard penalty, repeat the down`,
      netYards: 10,
      addDown: false,
    },
    // These have their own handlers
    {
      name: PENALTY_TYPES.KICKOFF_DRAG,
      description: `Kickoff Drag, automatic offense 40 yard line`,
      netYards: 0,
      addDown: false,
      hasOwnHandler: true,
    },
    {
      name: PENALTY_TYPES.KICKOFF_DRAG_SAFETY,
      description: `Kickoff Drag after a safety, automatic defense 40 yard line`,
      netYards: 0,
      addDown: false,
      hasOwnHandler: true,
    },
    {
      name: PENALTY_TYPES.KICKOFF_OUT_OF_BOUNDS,
      description: `Kickoff kicked out of bounds, automatic offense 40 yard line`,
      netYards: 0,
      addDown: false,
      hasOwnHandler: true,
    },
    {
      name: PENALTY_TYPES.KICKOFF_OUT_OF_BOUNDS_SAFETY,
      description: `Kickoff kicked out of bounds after a safety, automatic defense 40 yard line`,
      netYards: 0,
      addDown: false,
      hasOwnHandler: true,
    },
    {
      name: PENALTY_TYPES.KICKOFF_OFFSIDES,
      description: `Offsides Offense ${playerName}, automatic offense 40 yard line`,
      netYards: 0,
      addDown: false,
      hasOwnHandler: true,
    },
    {
      name: PENALTY_TYPES.KICKOFF_OFFSIDES_SAFETY,
      description: `Offsides Offense ${playerName} after a safety, automatic defense 40 yard line`,
      netYards: 0,
      addDown: false,
      hasOwnHandler: true,
    },
  ];

  const penalty = PENALTIES.find((penalty) => penalty.name === type);

  const { description, netYards, addDown } = penalty;

  Chat.send(`${ICONS.YellowSquare} ${description}`);

  // The play's handler already does the work
  if (penalty.hasOwnProperty("hasOwnHandler")) return;

  const getAdjustedNetYardsForRedzone = () => {
    const LOSYard = new DistanceCalculator(down.getLOS()).getYardLine();
    return Math.floor(LOSYard / 2);
  };

  const isRedZonePenaltyOnDefense = isInRedzone(down.getLOS()) && netYards > 0;

  const adjustedNetYards = isRedZonePenaltyOnDefense
    ? getAdjustedNetYardsForRedzone()
    : netYards;

  const endPosition = new DistanceCalculator([
    down.getLOS(),
    adjustedNetYards * MAP.YARD,
  ])
    .addByTeam(game.getOffenseTeam())
    .getDistance();

  const incrementRedZonePenalty = () => {
    if (!isRedZonePenaltyOnDefense) return;
    const currentValue = down.getState("redZonePenaltyCounter") ?? 0; // Set it to 0 initially
    down.setState("redZonePenaltyCounter", currentValue + 1);
  };

  incrementRedZonePenalty();

  const PENALTY_COUNTER_AUTO_TOUCHDOWN = 3;

  if (down.getState("redZonePenaltyCounter") === PENALTY_COUNTER_AUTO_TOUCHDOWN)
    return play.handleAutoTouchdown();

  play.endPlay({
    netYards: adjustedNetYards,
    endPosition: endPosition,
    addDown: addDown,
  });
};

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
