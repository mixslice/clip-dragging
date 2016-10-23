export const COLLISION_NONE = 0;
export const COLLISION_RIGHT = 1;
export const COLLISION_LEFT = 2;
export const COLLISION_BOTTOM = 3;
export const COLLISION_TOP = 4;

export class Clip {
  constructor(posX, posY, wRadius = 60) {
    this.x = posX;
    this.y = posY;
    this.color = '#FF0000';
    this.wRadius = wRadius;
    this.hRadius = 20;
    this.isShadow = false;
    this.collisionType = COLLISION_NONE;
    this.isStoryClip = true;
  }

  get radius() {
    return this.wRadius;
  }

  set radius(value) {
    this.wRadius = value;
  }

  copyProperties(copy) {
    this.color = copy.color;
    this.wRadius = copy.wRadius;
  }

  hitTest(hitX, hitY) {
    return (
      (hitX > this.x - this.wRadius)
      && (hitX < this.x + this.wRadius)
      && (hitY > this.y - this.hRadius)
      && (hitY < this.y + this.hRadius));
  }

  collisionTest(clip) {
    if (
      (clip.x < this.x + this.wRadius)
      && (clip.x > this.x - this.wRadius)
    ) {
      if (clip.x > this.x) {
        return COLLISION_RIGHT;
      }
      return COLLISION_LEFT;
    }
    return COLLISION_NONE;
  }

  verticalCollisionTest(clip) {
    if (
      (Math.abs(this.x - clip.x) < this.wRadius + clip.wRadius)
      && (clip.y < this.y + this.hRadius)
      && (clip.y > this.y - this.hRadius)
    ) {
      if (clip.y > this.y) {
        return COLLISION_BOTTOM;
      }
      return COLLISION_TOP;
    }
    return COLLISION_NONE;
  }

  isInLane(canvas, lane) {
    return (
      (this.y < canvas.height / 2 + lane * this.hRadius * 2 + this.hRadius)
      && (this.y > canvas.height / 2 + lane * this.hRadius * 2 - this.hRadius)
    );
  }

  drawToContext(ctx, dragging) {
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#fff';
    if (!this.isShadow) {
      ctx.fillRect(
        this.x - this.wRadius, this.y - this.hRadius,
        2 * this.wRadius, 2 * this.hRadius);

      if (__DEV__ && dragging) {
        if (this.collisionType === COLLISION_LEFT) {
          ctx.fillRect(
            this.x - this.wRadius, this.y - this.hRadius,
            this.wRadius, this.hRadius * 2);
        } else if (this.collisionType === COLLISION_RIGHT) {
          ctx.fillRect(
            this.x, this.y - this.hRadius,
            this.wRadius, this.hRadius * 2);
        } else if (this.collisionType === COLLISION_TOP) {
          ctx.fillRect(
            this.x - this.wRadius, this.y - this.hRadius,
            this.wRadius * 2, this.hRadius);
        } else if (this.collisionType === COLLISION_BOTTOM) {
          ctx.fillRect(
            this.x - this.wRadius, this.y,
            this.wRadius * 2, this.hRadius);
        }
      }
    }

    ctx.strokeRect(
      this.x - this.wRadius, this.y - this.hRadius,
      2 * this.wRadius, 2 * this.hRadius);
  }
}
