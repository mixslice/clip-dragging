import {
  RectParticle,
  COLLISION_LEFT,
  COLLISION_RIGHT,
} from './RectParticle';

export default class CanvasApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.numShapes = 5;
    this.easeAmount = 1;
    this.shapes = [];
    this.dragIndex = -1;
    this.dragging = false;
    this.draggingShape = null;
    this.shadowShape = null;
    this.dragHoldX = null;
    this.dragHoldY = null;
    this.timer = null;
    this.targetX = null;
    this.targetY = null;
    this.isStoryline = false;
  }

  draw() {
    this.shapes = [];
    this.makeShapes();
    this.drawScreen();
    this.canvas.addEventListener('mousedown', this.mouseDownListener.bind(this), false);
  }

  makeShapes() {
    let tempX = 0;
    this.shapes = [...Array(this.numShapes || 0)].map(() => {
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
      const tempShape = new RectParticle(tempX, tempY);

      tempShape.color = tempColor;
      tempShape.radius = tempRad;
      tempX += tempRad;
      return tempShape;
    });
  }

  mouseDownListener(event) {
    // getting mouse position correctly
    const bRect = this.canvas.getBoundingClientRect();
    const mouseX = (event.clientX - bRect.left) * (this.canvas.width / bRect.width);
    const mouseY = (event.clientY - bRect.top) * (this.canvas.height / bRect.height);

    this.shapes.every((shape, i) => {
      if (shape.hitTest(mouseX, mouseY)) {
        this.dragging = true;
        this.isStoryline = true;
        // the following variable will be reset if this loop repeats with another successful hit:
        this.shadowShape = shape;
        this.shadowShape.isShadow = true;
        this.dragIndex = i;
        return false;
      }
      return true;
    });

    if (this.dragging) {
      window.addEventListener('mousemove', this.mouseMoveListener.bind(this), false);

      // place currently dragged shape on top
      // this.shadowShape = this.shapes.splice(this.dragIndex, 1)[0];
      // this.shapes.push(this.draggingShape);
      // insert shadowShape
      this.draggingShape = new RectParticle(this.shadowShape.x, this.shadowShape.y);
      this.draggingShape.copyProperties(this.shadowShape);

      // shapeto drag is now last one in array
      this.dragHoldX = mouseX - this.draggingShape.x;
      this.dragHoldY = mouseY - this.draggingShape.y;

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
    // because of reordering, the dragging shape is the last one in the array.
    this.draggingShape.x += this.easeAmount * (this.targetX - this.draggingShape.x);
    this.draggingShape.y += this.easeAmount * (this.targetY - this.draggingShape.y);

    if (!this.isStoryline && this.isStoryline !== this.draggingShape.isStoryClip) {
      // remove clip
      this.draggingShape.isStoryClip = false;
      this.removeShapeFromStoryline();
    } else if (this.isStoryline && this.isStoryline !== this.draggingShape.isStoryClip) {
      // insert clip
      this.draggingShape.isStoryClip = true;
      let shouldAppendLast = true;
      this.shapes.every((shape, idx) => {
        const collisionType = shape.collisionTest(this.draggingShape);
        shape.collisionType = collisionType;
        if (collisionType) {
          if (collisionType === COLLISION_LEFT) {
            this.insertShapeToStoryline(shape.x - shape.radius, idx);
          } else if (collisionType === COLLISION_RIGHT) {
            this.insertShapeToStoryline(shape.x + shape.radius, idx + 1);
          }
          shouldAppendLast = false;
          return false;
        }
        return true;
      });

      if (shouldAppendLast) {
        const lastShape = this.shapes[this.shapes.length - 1];
        this.insertShapeToStoryline(lastShape.x + lastShape.radius, this.shapes.length);
      }

    } else if (this.isStoryline) {
      this.shapes.every((shape, idx) => {
        // skip shadow shape
        if (this.dragIndex === idx) return true;
        const collisionType = shape.collisionTest(this.draggingShape);
        shape.collisionType = collisionType;
        if (collisionType) {
          if (collisionType === COLLISION_LEFT && this.dragIndex !== idx - 1) {
            this.moveShapeInStoryline(shape.x - shape.radius, idx);
          } else if (collisionType === COLLISION_RIGHT && this.dragIndex !== idx + 1) {
            this.moveShapeInStoryline(shape.x + shape.radius, idx + 1);
          }
          return false;
        }
        return true;
      });
    }


    // stop the timer when the target position is reached (close enough)
    if (
      (!this.dragging)
      && (Math.abs(this.draggingShape.x - this.targetX) < 0.1)
      && (Math.abs(this.draggingShape.y - this.targetY) < 0.1)
    ) {
      this.draggingShape.x = this.targetX;
      this.draggingShape.y = this.canvas.height * 0.5
      - Math.floor((this.canvas.height * 0.5 - this.targetY + 20) / 40) * 40;
      // stop timer:
      clearInterval(this.timer);
    }
    this.drawScreen();
  }

  moveShapeInStoryline(posX, toIdx) {
    if (toIdx < this.dragIndex) {
      this.shadowShape.x = posX + this.shadowShape.radius;
      this.shadowShape = this.shapes.splice(this.dragIndex, 1)[0];
      this.shapes.splice(toIdx, 0, this.shadowShape);
      for (let i = toIdx + 1; i <= this.dragIndex; i += 1) {
        this.shapes[i].x += this.shadowShape.radius * 2;
      }
      this.dragIndex = toIdx;
    } else {
      this.shadowShape.x = posX - this.shadowShape.radius;
      this.shapes.splice(toIdx, 0, this.shadowShape);
      this.shadowShape = this.shapes.splice(this.dragIndex, 1)[0];
      for (let i = this.dragIndex; i < toIdx - 1; i += 1) {
        this.shapes[i].x -= this.shadowShape.radius * 2;
      }
      this.dragIndex = toIdx - 1;
    }
  }

  insertShapeToStoryline(posX, toIdx) {
    if (this.dragIndex < 0) {
      this.shadowShape.x = posX + this.shadowShape.radius;
      this.shapes.splice(toIdx, 0, this.shadowShape);
      this.shapes.slice(toIdx + 1, this.shapes.length).map((shape) => {
        shape.x += this.shadowShape.radius * 2;
        return shape;
      });
      this.dragIndex = toIdx;
    }
  }

  removeShapeFromStoryline() {
    if (this.dragIndex > -1) {
      this.shadowShape = this.shapes.splice(this.dragIndex, 1)[0];
      this.shapes.slice(this.dragIndex, this.shapes.length).map((shape) => {
        shape.x -= this.shadowShape.radius * 2;
        return shape;
      });
      this.dragIndex = -1;
    }
  }

  mouseUpListener() {
    this.canvas.addEventListener('mousedown', this.mouseDownListener, false);
    window.removeEventListener('mouseup', this.mouseUpListener, false);
    if (this.dragging) {
      this.dragging = false;
      this.shadowShape.isShadow = false;
      window.removeEventListener('mousemove', this.mouseMoveListener, false);
    }
  }

  mouseMoveListener(event) {
    let posX;
    let posY;
    const shapeRad = this.draggingShape.radius;
    const minX = shapeRad;
    const maxX = this.canvas.width - shapeRad;
    const minY = shapeRad;
    const maxY = this.canvas.height - shapeRad;

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
    this.isStoryline = this.draggingShape.isInLane(this.canvas, 0);
  }

  drawShapes() {
    this.shapes.forEach((shape) => {
      shape.drawToContext(this.context, this.dragging);
    });
    if (this.dragging && this.draggingShape) {
      this.draggingShape.drawToContext(this.context, this.dragging);
    }
  }

  drawScreen() {
    // bg
    this.context.fillStyle = '#333';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawShapes();
  }
}
