import Room, { TEAMS } from "..";
import ChatMessage from "../classes/ChatMessage";
import { GameCommand } from "./GameCommands";

export class GameCommandError {
  message: string;
  sendToPlayer: boolean;
  constructor(msg: string, sendToPlayer = true) {
    this.message = msg;
    this.sendToPlayer = sendToPlayer;
  }
}

export default class GameCommandHandler {
  chatObj: ChatMessage;
  gameCommand: GameCommand;

  constructor(chatObj: ChatMessage, gameCommand: GameCommand) {
    this.chatObj = chatObj;
    this.gameCommand = gameCommand;
  }

  private _validateBotAndGame() {
    if (Room.isBotOn === false)
      throw new GameCommandError("Bot is not on", false);

    if (!Room.game) throw new GameCommandError("No game in progess", false);
  }

  private _validateGameCommandProps() {
    const playerOnSpecs = this.chatObj.author.team === TEAMS.SPECTATORS;

    if (playerOnSpecs)
      throw new GameCommandError("You are not on the field", false);

    const playerIsOnOffense =
      this.chatObj.author.team === Room.game.offenseTeamId;

    if (this.gameCommand.permissions.onlyOffense && playerIsOnOffense === false)
      throw new GameCommandError("You are not on offense");

    if (
      this.gameCommand.permissions.adminLevel > this.chatObj.author.adminLevel
    )
      throw new GameCommandError("Too low admin level to use that command");
  }

  private _validatePlay() {
    const playAlreadyInProgess = Boolean(Room.game.play);

    if (playAlreadyInProgess && this.gameCommand.permissions.onlyDuringNoPlay)
      throw new GameCommandError("There is already a play in progress");
  }

  validateAndRun() {
    this._validateBotAndGame();
    this._validateGameCommandProps();
    this._validatePlay();

    // If we didn't throw any errors, now we are going to run the play, but the internal run()
    // on the game command can still throw errors
    this.gameCommand.run(this.chatObj.author);
  }
}
