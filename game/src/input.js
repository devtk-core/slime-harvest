// Mouse, touch and keyboard, translated into game actions.
// Coordinates arrive in CSS pixels and are converted to view space by the
// toView function main.js supplies (the canvas letterboxes the 960x640 view).

export function attachInput(canvas, toView, handlers) {
  let lastX = null;

  canvas.addEventListener('pointermove', (event) => {
    const p = toView(event.clientX, event.clientY);
    lastX = p.x;
    handlers.onAim(p.x);
  });

  canvas.addEventListener('pointerdown', (event) => {
    const p = toView(event.clientX, event.clientY);
    lastX = p.x;
    handlers.onAim(p.x);
    handlers.onPress(p.x, p.y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat && event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') {
      if (event.code === 'Space') event.preventDefault();
      return;
    }
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        handlers.onAimKey(-1);
        event.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        handlers.onAimKey(1);
        event.preventDefault();
        break;
      case 'ArrowDown':
      case 'Space':
        handlers.onPress(lastX, null);
        event.preventDefault();
        break;
      case 'KeyR':
        handlers.onRestart();
        break;
      case 'KeyP':
        handlers.onPause();
        break;
      default:
        break;
    }
  });
}
