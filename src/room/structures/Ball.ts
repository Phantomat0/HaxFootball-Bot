import { Position, TeamId } from "../HBClient";
import { MAP__AREAS } from "../utils/map";
import Room from "../roomStructures/Room";
import client from "..";

class Ball {
  getPosition() {
    return client.getBallPosition();
  }

  getSpeed() {
    const { xspeed, yspeed } = client.getDiscProperties(0);
    return {
      xspeed,
      yspeed,
    };
  }

  setPosition(position: Position) {
    const { x, y = 0 } = position;
    client.setDiscProperties(0, {
      x: x,
      y: y,
      xspeed: 0,
      yspeed: 0,
      ygravity: 0,
    });
    return this;
  }

  suppress() {
    client.setDiscProperties(0, {
      invMass: 0.000001,
      xspeed: 0,
      yspeed: 0,
    });
    return this;
  }

  release() {
    client.setDiscProperties(0, {
      invMass: 1,
      xspeed: 0,
      yspeed: 0,
    });
    return this;
  }

  score(team: Omit<TeamId, "0">) {
    const x =
      team === 2 ? MAP__AREAS.BLUE_SCORE_LINE : MAP__AREAS.RED_SCORE_LINE;
    client.setDiscProperties(0, {
      x: x,
      y: -200,
      xspeed: 0,
      yspeed: 0,
      ygravity: 0.015,
      invMass: 0.000001,
    });
  }
}

export default new Ball();
