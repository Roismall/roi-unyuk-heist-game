// Meridian Heist — level data.
// Each level is one room: walls, guard patrols, rotating cameras,
// loot pieces, the exit, and the brief shown before play.
export const LEVELS = [
  {
    name: "Level 1 — Museum Gallery",
    brief: "The Meridian Gallery after dark. Slip past the night guards, lift the three star pieces, and reach the service door.",
    walls: [
      [0, 0, 960, 16], [0, 584, 960, 16], [0, 0, 16, 600], [944, 0, 16, 600],
      [220, 120, 180, 24], [560, 120, 180, 24],
      [120, 300, 24, 160], [816, 300, 24, 160],
      [380, 420, 200, 24], [380, 180, 24, 120],
    ],
    guards: [
      { path: [[300, 240], [660, 240], [660, 480], [300, 480]], speed: 1.1 },
      { path: [[700, 500], [700, 120], [480, 120]], speed: 1.0 },
    ],
    cameras: [
      { x: 480, y: 72, base: Math.PI / 2, sweep: 0.9, speed: 0.012, range: 170 },
      { x: 920, y: 300, base: Math.PI, sweep: 0.7, speed: 0.016, range: 150 },
    ],
    loot: [
      { x: 300, y: 90, kind: "gem", required: true, label: "Star Sapphire" },
      { x: 660, y: 90, kind: "gem", required: true, label: "Moon Opal" },
      { x: 480, y: 540, kind: "gold", required: true, label: "Gilded Mask" },
      { x: 60, y: 540, kind: "coin", required: false, label: "Loose Change" },
    ],
    exit: { x: 880, y: 520, w: 56, h: 56 },
    start: { x: 60, y: 60 },
    gadgets: { coin: 2, hack: 1, smoke: 1 },
  },
  {
    name: "Level 2 — Bank Vault",
    brief: "Meridian Bank's vault floor. More guards, more cameras, tighter corridors. Four vault pieces, then the back exit.",
    walls: [
      [0, 0, 960, 16], [0, 584, 960, 16], [0, 0, 16, 600], [944, 0, 16, 600],
      [180, 0, 24, 180], [180, 240, 24, 344],
      [480, 120, 24, 220], [480, 420, 24, 164],
      [700, 0, 24, 200], [700, 260, 24, 324],
      [300, 300, 160, 24], [560, 420, 160, 24],
    ],
    guards: [
      { path: [[100, 100], [100, 500], [260, 500], [260, 100]], speed: 1.2 },
      { path: [[400, 80], [400, 500]], speed: 1.1 },
      { path: [[620, 520], [620, 80], [860, 80], [860, 520]], speed: 1.3 },
    ],
    cameras: [
      { x: 340, y: 72, base: Math.PI / 2, sweep: 1.0, speed: 0.014, range: 180 },
      { x: 600, y: 560, base: -Math.PI / 2, sweep: 0.8, speed: 0.018, range: 160 },
      { x: 920, y: 200, base: Math.PI, sweep: 0.6, speed: 0.012, range: 150 },
    ],
    loot: [
      { x: 340, y: 90, kind: "gold", required: true, label: "Vault Bars" },
      { x: 620, y: 90, kind: "gem", required: true, label: "Crown Jewel" },
      { x: 340, y: 520, kind: "gold", required: true, label: "Bond Case" },
      { x: 860, y: 300, kind: "gem", required: true, label: "Rare Coin Set" },
      { x: 60, y: 300, kind: "coin", required: false, label: "Loose Change" },
    ],
    exit: { x: 880, y: 540, w: 56, h: 44 },
    start: { x: 60, y: 60 },
    gadgets: { coin: 2, hack: 2, smoke: 1 },
  },
  {
    name: "Level 3 — Rooftop Penthouse",
    brief: "The penthouse on the Meridian tower roof. The crew's last score: five pieces behind a full security detail. Grab them all and vanish.",
    walls: [
      [0, 0, 960, 16], [0, 584, 960, 16], [0, 0, 16, 600], [944, 0, 16, 600],
      [200, 140, 140, 24], [620, 140, 140, 24],
      [120, 320, 24, 140], [816, 320, 24, 140],
      [420, 300, 120, 24], [420, 460, 120, 24],
      [300, 480, 24, 104], [660, 100, 24, 104],
    ],
    guards: [
      { path: [[200, 260], [760, 260], [760, 420], [200, 420]], speed: 1.3 },
      { path: [[480, 80], [480, 520]], speed: 1.2 },
      { path: [[120, 120], [840, 120]], speed: 1.1 },
      { path: [[840, 480], [120, 480]], speed: 1.2 },
    ],
    cameras: [
      { x: 480, y: 72, base: Math.PI / 2, sweep: 1.1, speed: 0.016, range: 190 },
      { x: 40, y: 300, base: 0, sweep: 0.8, speed: 0.014, range: 160 },
      { x: 920, y: 300, base: Math.PI, sweep: 0.8, speed: 0.02, range: 160 },
    ],
    loot: [
      { x: 270, y: 90, kind: "gem", required: true, label: "Penthouse Diamond" },
      { x: 690, y: 90, kind: "gold", required: true, label: "Gold Ledger" },
      { x: 480, y: 260, kind: "gem", required: true, label: "Emerald Idol" },
      { x: 270, y: 540, kind: "gold", required: true, label: "Art Crate" },
      { x: 690, y: 540, kind: "gem", required: true, label: "Pearl Tiara" },
      { x: 60, y: 300, kind: "coin", required: false, label: "Loose Change" },
    ],
    exit: { x: 880, y: 64, w: 56, h: 56 },
    start: { x: 60, y: 540 },
    gadgets: { coin: 3, hack: 2, smoke: 2 },
  },
];
