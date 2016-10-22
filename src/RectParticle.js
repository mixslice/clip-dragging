// Simple class example

function RectParticle(posX, posY) {
  this.x = posX;
  this.y = posY;
  this.color = '#FF0000';
  this.defaultColor = '#FF0000';
  this.wradius = 60;
  this.hradius = 20;
}

// The function below returns a Boolean value representing
// whether the point with the coordinates supplied "hits" the particle.
RectParticle.prototype.hitTest = function (hitX, hitY) {
  return (
    (hitX > this.x - this.wradius)
    && (hitX < this.x + this.wradius)
    && (hitY > this.y - this.hradius)
    && (hitY < this.y + this.hradius));
};

RectParticle.prototype.collisionTest = function (shape) {
  return (
    (shape.y - this.y < shape.hradius)
    && (this.y - shape.y <= shape.hradius)
    && (Math.abs(shape.x - this.x) < shape.wradius + this.wradius));
};

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
};

// A function for drawing the particle.
RectParticle.prototype.drawToContext = function (theContext) {
  theContext.fillStyle = this.color;
  theContext.strokeStyle = '#fff';
  theContext.fillRect(
    this.x - this.wradius, this.y - this.hradius,
    2 * this.wradius, 2 * this.hradius);
  theContext.strokeRect(
    this.x - this.wradius, this.y - this.hradius,
    2 * this.wradius, 2 * this.hradius);
};

export default RectParticle;
