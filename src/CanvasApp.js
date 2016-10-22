import RectParticle from './RectParticle';

export default class CanvasApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.numShapes = 0;
    this.shapes = [];
    this.dragIndex = null;
    this.dragging = false;
    this.mouseX = null;
    this.mouseY = null;
    this.dragHoldX = null;
    this.dragHoldY = null;
    this.timer = null;
    this.targetX = null;
    this.targetY = null;
    this.easeAmount = null;
  }

  draw() {
    this.numShapes = 5;
    this.easeAmount = 1;

    this.shapes = [];
    this.makeShapes();
    this.drawScreen();
    this.canvas.addEventListener('mousedown', this.mouseDownListener.bind(this), false);
  }

  makeShapes() {
    let tempX;
    let tempY;
    let tempRad;
    let tempR;
    let tempG;
    let tempB;
    let tempA;
    let tempColor;

    this.shapes = [...Array(this.numShapes || 0)].map((obj, idx) => {
      tempRad = Math.floor(Math.random() * 5);
      tempX = idx * 120 + 60;
      tempY = this.canvas.height * 0.5;

      // we set a randomized color, including a random alpha (transparency) value.
      // The color is set using the rgba() method.
      tempR = Math.floor(Math.random() * 255);
      tempG = Math.floor(Math.random() * 255);
      tempB = Math.floor(Math.random() * 255);
      tempA = 0.8;
      tempColor = `rgba(${tempR},${tempG},${tempB},${tempA})`;

      // randomly select either a circle or a square
      const tempShape = new RectParticle(tempX, tempY);

      tempShape.color = tempColor;
      tempShape.defaultColor = tempColor;
      tempShape.radius = tempRad;
      return tempShape;
    });
  }

  mouseDownListener(evt) {
    // getting mouse position correctly
    const bRect = this.canvas.getBoundingClientRect();
    const mouseX = (evt.clientX - bRect.left) * (this.canvas.width / bRect.width);
    const mouseY = (evt.clientY - bRect.top) * (this.canvas.height / bRect.height);

    for (let i = 0; i < this.numShapes; i++) {
      if (this.shapes[i].hitTest(mouseX, mouseY)) {
        this.dragging = true;
        // the following variable will be reset if this loop repeats with another successful hit:
        this.dragIndex = i;
      }
    }

    if (this.dragging) {
      window.addEventListener('mousemove', this.mouseMoveListener.bind(this), false);

      // place currently dragged shape on top
      const draggingShape = this.shapes.splice(this.dragIndex, 1)[0];
      this.shapes.push(draggingShape);

      // shapeto drag is now last one in array
      this.dragHoldX = mouseX - draggingShape.x;
      this.dragHoldY = mouseY - draggingShape.y;

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
    evt.preventDefault();
    return false;
  }

  onTimerTick() {
    const draggingShape = this.shapes[this.numShapes - 1];

    // because of reordering, the dragging shape is the last one in the array.
    draggingShape.x += this.easeAmount * (this.targetX - draggingShape.x);
    draggingShape.y += this.easeAmount * (this.targetY - draggingShape.y);

    for (let i = 0; i < this.numShapes; i++) {
      if (this.shapes[i].collisionTest(draggingShape)) {
        this.shapes[i].color = draggingShape.color;
      } else {
        this.shapes[i].color = this.shapes[i].defaultColor;
      }
    }

    // stop the timer when the target position is reached (close enough)
    if (
      (!this.dragging)
      && (Math.abs(draggingShape.x - this.targetX) < 0.1)
      && (Math.abs(draggingShape.y - this.targetY) < 0.1)
    ) {
      draggingShape.x = this.targetX;
      draggingShape.y = this.canvas.height * 0.5
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

  mouseMoveListener(evt) {
    let posX;
    let posY;
    const shapeRad = this.shapes[this.numShapes - 1].radius;
    const minX = shapeRad;
    const maxX = this.canvas.width - shapeRad;
    const minY = shapeRad;
    const maxY = this.canvas.height - shapeRad;

    // getting mouse position correctly
    const bRect = this.canvas.getBoundingClientRect();
    this.mouseX = (evt.clientX - bRect.left) * (this.canvas.width / bRect.width);
    this.mouseY = (evt.clientY - bRect.top) * (this.canvas.height / bRect.height);

    // clamp x and y positions to prevent object from dragging outside of canvas
    posX = this.mouseX - this.dragHoldX;
    posX = (posX < minX) ? minX : ((posX > maxX) ? maxX : posX);
    posY = this.mouseY - this.dragHoldY;
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
    this.context.fillStyle = '#000';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawShapes();
  }
}
