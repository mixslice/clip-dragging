import RectParticle from './RectParticle';

export default class CanvasApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.numShapes = 5;
    this.easeAmount = 1;
    this.shapes = [];
    this.dragIndex = null;
    this.dragging = false;
    this.draggingShape = null;
    this.dragHoldX = null;
    this.dragHoldY = null;
    this.timer = null;
    this.targetX = null;
    this.targetY = null;
  }

  draw() {
    this.shapes = [];
    this.makeShapes();
    this.drawScreen();
    this.canvas.addEventListener('mousedown', this.mouseDownListener.bind(this), false);
  }

  makeShapes() {
    this.shapes = [...Array(this.numShapes || 0)].map((obj, idx) => {
      const tempRad = Math.floor(Math.random() * 5);
      const tempX = idx * 120 + 60;
      const tempY = this.canvas.height * 0.5;

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
      tempShape.defaultColor = tempColor;
      tempShape.radius = tempRad;
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
        // the following variable will be reset if this loop repeats with another successful hit:
        this.dragIndex = i;
        return false;
      }
      return true;
    });

    if (this.dragging) {
      window.addEventListener('mousemove', this.mouseMoveListener.bind(this), false);

      // place currently dragged shape on top
      this.draggingShape = this.shapes.splice(this.dragIndex, 1)[0];
      this.shapes.push(this.draggingShape);

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

    this.shapes.forEach((shape) => {
      if (shape.collisionTest(this.draggingShape)) {
        shape.color = this.draggingShape.color;
      } else {
        shape.color = shape.defaultColor;
      }
    });

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

  mouseUpListener() {
    this.canvas.addEventListener('mousedown', this.mouseDownListener, false);
    window.removeEventListener('mouseup', this.mouseUpListener, false);
    if (this.dragging) {
      this.dragging = false;
      window.removeEventListener('mousemove', this.mouseMoveListener, false);
    }
  }

  mouseMoveListener(event) {
    let posX;
    let posY;
    const shapeRad = this.shapes[this.numShapes - 1].radius;
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
  }

  drawShapes() {
    this.shapes.forEach((shape) => {
      shape.drawToContext(this.context);
    });
  }

  drawScreen() {
    // bg
    this.context.fillStyle = '#333';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawShapes();
  }
}
