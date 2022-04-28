import BallContact from "../../classes/BallContact";

export default abstract class PlayEventsBase {
  abstract handleBallContact(ballContactObj: BallContact): void;
  protected abstract _handleBallContactOffense(
    ballContactObj: BallContact
  ): void;
  protected abstract _handleBallContactDefense(
    ballContactObj: BallContact
  ): void;
}
