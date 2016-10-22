export default class RectParticle {
  constructor(posX, posY) {
    this.x = posX;
    this.y = posY;
    this.color = '#FF0000';
    this.defaultColor = '#FF0000';
    this.wradius = 60;
    this.hradius = 20;
  }

  hitTest(hitX, hitY) {
    return (
      (hitX > this.x - this.wradius)
      && (hitX < this.x + this.wradius)
      && (hitY > this.y - this.hradius)
      && (hitY < this.y + this.hradius));
  }

  collisionTest(shape) {
    return (
      (shape.y - this.y < shape.hradius)
      && (this.y - shape.y <= shape.hradius)
      && (Math.abs(shape.x - this.x) < shape.wradius + this.wradius));
  }

  drawToContext(theContext) {
    theContext.fillStyle = this.color;
    theContext.strokeStyle = '#fff';
    theContext.fillRect(
      this.x - this.wradius, this.y - this.hradius,
      2 * this.wradius, 2 * this.hradius);
    theContext.strokeRect(
      this.x - this.wradius, this.y - this.hradius,
      2 * this.wradius, 2 * this.hradius);
  }
}
