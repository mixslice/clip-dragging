import CanvasApp from './CanvasApp';

function windowLoadHandler() {
  const theCanvas = document.getElementById('canvasOne');
  const canvasApp = new CanvasApp(theCanvas);
  canvasApp.draw();
}

window.addEventListener('load', windowLoadHandler, false);
