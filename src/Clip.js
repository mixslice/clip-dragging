export const COLLISION_NONE = 0;
export const COLLISION_RIGHT = 1;
export const COLLISION_LEFT = 2;

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
    this.bottomClips = [];
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

  horizontalCollisionTest(clip) {
    return (Math.abs(this.x - clip.x) < this.wRadius + clip.wRadius);
  }

  verticalCollisionTest(clip) {
    return (Math.abs(this.y - clip.y) < this.hRadius + clip.hRadius);
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
        }
      }
    }

    ctx.strokeRect(
      this.x - this.wRadius, this.y - this.hRadius,
      2 * this.wRadius, 2 * this.hRadius);
  }
}
