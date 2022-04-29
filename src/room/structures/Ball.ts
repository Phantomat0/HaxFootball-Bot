import { PlayableTeamId, Position, TeamId } from "../HBClient";
import { DISC_IDS, MAP__AREAS } from "../utils/map";
import { client } from "..";

class Ball {
  IMMOVABLE_INV_MASS: 0.000001;

  getPosition() {
    return client.getBallPosition();
  }

  getSpeed() {
    const { xspeed, yspeed } = client.getDiscProperties(DISC_IDS.BALL);
    return {
      xspeed,
      yspeed,
    };
  }

  setPosition(position: Position) {
    const { x, y = 0 } = position;
    client.setDiscProperties(DISC_IDS.BALL, {
      x: x,
      y: y,
      xspeed: 0,
      yspeed: 0,
      ygravity: 0,
    });
    return this;
  }

  suppress() {
    client.setDiscProperties(DISC_IDS.BALL, {
      invMass: this.IMMOVABLE_INV_MASS,
      xspeed: 0,
      yspeed: 0,
    });
    return this;
  }

  release() {
    client.setDiscProperties(DISC_IDS.BALL, {
      invMass: 1,
      xspeed: 0,
      yspeed: 0,
    });
    return this;
  }

  score(teamId: PlayableTeamId) {
    const x =
      teamId === 2 ? MAP__AREAS.BLUE_SCORE_LINE : MAP__AREAS.RED_SCORE_LINE;
    client.setDiscProperties(0, {
      x: x,
      y: -200,
      xspeed: 0,
      yspeed: 0,
      ygravity: 0.015,
      invMass: this.IMMOVABLE_INV_MASS,
    });
  }

  removeGravity() {
    client.setDiscProperties(DISC_IDS.BALL, {
      invMass: 1,
      xspeed: 0,
      ygravity: 0,
    });
    return this;
  }
}

export default new Ball();
