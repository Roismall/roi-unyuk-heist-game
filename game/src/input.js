// input.js — keyboard and mouse state for the heist. WASD/arrows move,
// Shift sneaks, E hacks the nearest camera, mouse click throws a coin,
// M mutes, R restarts the level, P pauses, Enter confirms screens.

export class Input {
  constructor(canvas, yOffset = 0) {
    this.keys = new Set();
    this.pressed = new Set(); // keys hit since the last consume
    this.mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
    this.canvas = canvas;
    this.yOffset = yOffset; // screen-space bar above the world (HUD)

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (!e.repeat) this.pressed.add(e.key.toLowerCase());
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouse.y = ((e.clientY - r.top) / r.height) * canvas.height - this.yOffset;
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.clickX = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouse.clickY = ((e.clientY - r.top) / r.height) * canvas.height - this.yOffset;
      this.mouse.clicked = true;
    });
  }

  // True only on the frame the key went down.
  wasPressed(key) {
    return this.pressed.has(key.toLowerCase());
  }

  consumePressed() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }

  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const n = Math.hypot(x, y);
      x /= n;
      y /= n;
    }
    return { x, y };
  }

  get sneaking() {
    return this.keys.has('shift');
  }
}
