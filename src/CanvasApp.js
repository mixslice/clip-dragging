import {
  Clip,
  COLLISION_LEFT,
  COLLISION_RIGHT,
} from './Clip';

export default class CanvasApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.laneHeightHalf = 20;
    this.laneHeight = this.laneHeightHalf * 2;
    this.numClips = 10;
    this.easeAmount = 1;
    this.storylineClips = [];
    this.laneClips = [];
    this.dragIndex = -1;
    this.dragging = false;
    this.draggingClip = null;
    this.shadowClip = null;
    this.dragHoldX = null;
    this.dragHoldY = null;
    this.timer = null;
    this.targetX = null;
    this.targetY = null;
    this.isStoryline = false;
  }

  getLane(posY) {
    return -Math.floor((posY - this.canvas.height * 0.5 + 20) / 40);
  }

  draw() {
    this.storylineClips = [];
    this.makeClips();
    this.drawScreen();
    this.canvas.addEventListener('mousedown', this.mouseDownListener.bind(this), false);
  }

  makeClips() {
    let tempX = 0;
    this.storylineClips = [...Array(this.numClips || 0)].map(() => {
      const tempY = this.canvas.height * 0.5;
      const tempRad = 10 + Math.floor(Math.random() * 70);
      tempX += tempRad;

      // we set a randomized color, including a random alpha (transparency) value.
      // The color is set using the rgba() method.
      const tempR = Math.floor(Math.random() * 255);
      const tempG = Math.floor(Math.random() * 255);
      const tempB = Math.floor(Math.random() * 255);
      const tempA = 0.8;
      const tempColor = `rgba(${tempR},${tempG},${tempB},${tempA})`;

      // randomly select either a circle or a square
      const tempClip = new Clip(tempX, tempY);

      tempClip.color = tempColor;
      tempClip.radius = tempRad;
      tempX += tempRad;
      return tempClip;
    });
  }

  mouseDownListener(event) {
    // getting mouse position correctly
    const bRect = this.canvas.getBoundingClientRect();
    const mouseX = (event.clientX - bRect.left) * (this.canvas.width / bRect.width);
    const mouseY = (event.clientY - bRect.top) * (this.canvas.height / bRect.height);
    const lane = this.getLane(mouseY);

    if (lane === 0) {
      this.storylineClips.every((clip, i) => {
        if (clip.hitTest(mouseX, mouseY)) {
          this.dragging = true;
          this.isStoryline = true;
          // the following variable will be reset if this loop repeats with another successful hit:
          this.shadowClip = clip;
          this.shadowClip.isShadow = true;
          this.dragIndex = i;
          return false;
        }
        return true;
      });
    } else {
      this.laneClips.every((clip) => {
        if (clip.hitTest(mouseX, mouseY)) {
          this.dragging = true;
          this.isStoryline = false;
          // the following variable will be reset if this loop repeats with another successful hit:
          this.shadowClip = clip;
          this.shadowClip.isShadow = true;
          this.dragIndex = -1;
          return false;
        }
        return true;
      });
    }

    if (this.dragging) {
      window.addEventListener('mousemove', this.mouseMoveListener.bind(this), false);

      // place currently dragged clip on top
      // this.shadowClip = this.storylineClips.splice(this.dragIndex, 1)[0];
      // this.storylineClips.push(this.draggingClip);
      // insert shadowClip
      this.draggingClip = new Clip(this.shadowClip.x, this.shadowClip.y);
      this.draggingClip.copyProperties(this.shadowClip);

      // clipto drag is now last one in array
      this.dragHoldX = mouseX - this.draggingClip.x;
      this.dragHoldY = mouseY - this.draggingClip.y;

      // The "target" position is where the object should be if it were to
      // move there instantaneously. But we will set up the code so that
      // this target position is approached gradually, producing a smooth motion.
      this.targetX = mouseX - this.dragHoldX;
      this.targetY = mouseY - this.dragHoldY;

      // start timer
      this.timer = setInterval(this.onTimerTick.bind(this), 1000 / 90);
    }

    this.canvas.removeEventListener('mousedown', this.mouseDownListener, false);
    window.addEventListener('mouseup', this.mouseUpListener.bind(this), false);

    // code below prevents the mouse down from having an effect on the main browser window:
    event.preventDefault();
    return false;
  }

  onTimerTick() {
    // because of reordering, the dragging clip is the last one in the array.
    this.draggingClip.x += this.easeAmount * (this.targetX - this.draggingClip.x);
    this.draggingClip.y += this.easeAmount * (this.targetY - this.draggingClip.y);

    if (!this.isStoryline && this.isStoryline !== this.draggingClip.isStoryClip) {
      // remove clip
      this.draggingClip.isStoryClip = false;
      this.removeClipFromStoryline();
    } else if (this.isStoryline && this.isStoryline !== this.draggingClip.isStoryClip) {
      // insert clip
      this.draggingClip.isStoryClip = true;
      let shouldAppendLast = true;
      this.storylineClips.every((clip, idx) => {
        const collisionType = clip.collisionTest(this.draggingClip);
        clip.collisionType = collisionType;
        if (collisionType) {
          if (collisionType === COLLISION_LEFT) {
            this.insertClipToStoryline(clip.x - clip.radius, idx);
          } else if (collisionType === COLLISION_RIGHT) {
            this.insertClipToStoryline(clip.x + clip.radius, idx + 1);
          }
          shouldAppendLast = false;
          return false;
        }
        return true;
      });

      if (shouldAppendLast) {
        const lastClip = this.storylineClips[this.storylineClips.length - 1];
        this.insertClipToStoryline(lastClip.x + lastClip.radius, this.storylineClips.length);
      }
    } else if (this.isStoryline) {
      this.storylineClips.every((clip, idx) => {
        // skip shadow clip
        if (this.dragIndex === idx) return true;
        const collisionType = clip.collisionTest(this.draggingClip);
        clip.collisionType = collisionType;
        if (collisionType) {
          if (collisionType === COLLISION_LEFT && this.dragIndex !== idx - 1) {
            this.moveClipInStoryline(clip.x - clip.radius, idx);
          } else if (collisionType === COLLISION_RIGHT && this.dragIndex !== idx + 1) {
            this.moveClipInStoryline(clip.x + clip.radius, idx + 1);
          }
          return false;
        }
        return true;
      });
    } else {
      // clip not in storyline
      const lane = this.getLane(this.draggingClip.y);
      const sign = Math.sign(lane);
      this.shadowClip.y = this.canvas.height * 0.5
        - lane * this.laneHeight;
      this.shadowClip.x = this.draggingClip.x;

      // this.laneClips.every((clip) => {
      //   if (this.shadowClip === clip) return false;
      //   const isCollision = clip.horizontalCollisionTest(this.draggingClip);
      //   const idx1 = this.shadowClip.bottomClips.indexOf(clip);
      //   const idx2 = clip.bottomClips.indexOf(this.shadowClip);
      //   if (isCollision && this.draggingClip.y < clip.y && idx1 < 0) {
      //     this.shadowClip.bottomClips.push(clip);
      //   } else if (isCollision && this.draggingClip.y > clip.y && idx2 < 0) {
      //     clip.bottomClips.push(this.shadowClip);
      //   } else if (((isCollision && this.draggingClip.y > clip.y) || !isCollision) && idx1 > -1) {
      //     this.shadowClip.bottomClips.splice(idx1, 1);
      //   } else if (((isCollision && this.draggingClip.y < clip.y) || !isCollision) && idx2 > -1) {
      //     clip.bottomClips.splice(idx2, 1);
      //   }
      //   clip.y = this.canvas.height * 0.5 - this.laneHeight - (clip.bottomClips.length ? sign * this.laneHeight : 0);
      //   return true;
      // });
      // this.shadowClip.y -= this.shadowClip.bottomClips.length ? sign * this.laneHeight : 0;
    }


    // stop the timer when the target position is reached (close enough)
    if (
      (!this.dragging)
      && (Math.abs(this.draggingClip.x - this.targetX) < 0.1)
      && (Math.abs(this.draggingClip.y - this.targetY) < 0.1)
    ) {
      this.draggingClip.x = this.targetX;
      this.draggingClip.y = this.canvas.height * 0.5
      - Math.floor((this.canvas.height * 0.5 - this.targetY + 20) / 40) * 40;
      // stop timer:
      clearInterval(this.timer);
    }
    this.drawScreen();
  }

  moveClipInStoryline(posX, toIdx) {
    if (toIdx < this.dragIndex) {
      this.shadowClip.x = posX + this.shadowClip.radius;
      this.shadowClip = this.storylineClips.splice(this.dragIndex, 1)[0];
      this.storylineClips.splice(toIdx, 0, this.shadowClip);
      for (let i = toIdx + 1; i <= this.dragIndex; i += 1) {
        this.storylineClips[i].x += this.shadowClip.radius * 2;
      }
      this.dragIndex = toIdx;
    } else {
      this.shadowClip.x = posX - this.shadowClip.radius;
      this.storylineClips.splice(toIdx, 0, this.shadowClip);
      this.shadowClip = this.storylineClips.splice(this.dragIndex, 1)[0];
      for (let i = this.dragIndex; i < toIdx - 1; i += 1) {
        this.storylineClips[i].x -= this.shadowClip.radius * 2;
      }
      this.dragIndex = toIdx - 1;
    }
  }

  insertClipToStoryline(posX, toIdx) {
    if (this.dragIndex < 0) {
      this.shadowClip.x = posX + this.shadowClip.radius;
      this.shadowClip.y = this.canvas.height * 0.5;
      const idx = this.laneClips.indexOf(this.shadowClip);
      this.laneClips.splice(idx, 1);
      this.storylineClips.splice(toIdx, 0, this.shadowClip);
      this.storylineClips.slice(toIdx + 1, this.storylineClips.length).map((clip) => {
        clip.x += this.shadowClip.radius * 2;
        return clip;
      });
      this.dragIndex = toIdx;
    }
  }

  removeClipFromStoryline() {
    if (this.dragIndex > -1) {
      this.shadowClip = this.storylineClips.splice(this.dragIndex, 1)[0];
      this.laneClips.push(this.shadowClip);
      this.storylineClips.slice(this.dragIndex, this.storylineClips.length).map((clip) => {
        clip.x -= this.shadowClip.radius * 2;
        return clip;
      });
      this.dragIndex = -1;
    }
  }

  mouseUpListener() {
    this.canvas.addEventListener('mousedown', this.mouseDownListener, false);
    window.removeEventListener('mouseup', this.mouseUpListener, false);
    if (this.dragging) {
      this.dragging = false;
      this.shadowClip.isShadow = false;
      window.removeEventListener('mousemove', this.mouseMoveListener, false);
    }
  }

  mouseMoveListener(event) {
    let posX;
    let posY;
    const wRadius = this.draggingClip.wRadius;
    const minX = wRadius;
    const maxX = this.canvas.width - wRadius;
    const minY = this.laneHeightHalf;
    const maxY = this.canvas.height - this.laneHeightHalf;

    // getting mouse position correctly
    const bRect = this.canvas.getBoundingClientRect();
    const mouseX = (event.clientX - bRect.left) * (this.canvas.width / bRect.width);
    const mouseY = (event.clientY - bRect.top) * (this.canvas.height / bRect.height);

    // clamp x and y positions to prevent object from dragging outside of canvas
    posX = mouseX - this.dragHoldX;
    posX = (posX < minX) ? minX : ((posX > maxX) ? maxX : posX);
    posY = mouseY - this.dragHoldY;
    posY = (posY < minY) ? minY : ((posY > maxY) ? maxY : posY);

    this.targetX = posX;
    this.targetY = posY;
    this.isStoryline = this.draggingClip.isInLane(this.canvas, 0);
  }

  drawClips() {
    [...this.storylineClips, ...this.laneClips].forEach((clip) => {
      clip.drawToContext(this.context, this.dragging);
    });
    if (this.dragging && this.draggingClip) {
      this.draggingClip.drawToContext(this.context, this.dragging);
    }
  }

  drawScreen() {
    // bg
    this.context.fillStyle = '#333';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawClips();
  }
}
