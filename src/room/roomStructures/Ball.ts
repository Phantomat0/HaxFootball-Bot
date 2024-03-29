import { DiscPropertiesObject, PlayableTeamId, Position } from "../HBClient";
import { DISC_IDS, MAP_POINTS } from "../utils/map";
import client from "..";
import { TEAMS } from "../utils/types";

class Ball {
  private IMMOVABLE_INV_MASS: number = 0.00001;

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

  makeImmovableButKeepSpeed() {
    client.setDiscProperties(DISC_IDS.BALL, {
      invMass: this.IMMOVABLE_INV_MASS,
    });
    return this;
  }

  score(teamEndzoneToScore: PlayableTeamId) {
    const x =
      teamEndzoneToScore === TEAMS.BLUE
        ? MAP_POINTS.BLUE_SCORE_LINE
        : MAP_POINTS.RED_SCORE_LINE;
    client.setDiscProperties(DISC_IDS.BALL, {
      x: x,
      y: -200,
      xspeed: 0,
      yspeed: 0,
      ygravity: 0.015,
      invMass: this.IMMOVABLE_INV_MASS,
    });
  }

  setGravity({ x, y }: { x?: number; y?: number }) {
    if (typeof x === "number") {
      client.setDiscProperties(DISC_IDS.BALL, {
        xgravity: x,
      });
    }

    if (typeof y === "number") {
      client.setDiscProperties(DISC_IDS.BALL, {
        ygravity: y,
      });
    }

    return this;
  }

  setProperties(properties: Partial<DiscPropertiesObject>) {
    client.setDiscProperties(DISC_IDS.BALL, properties);
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
