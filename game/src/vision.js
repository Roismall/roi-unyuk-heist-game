// vision.js — the geometry behind every vision cone: segment intersection,
// line-of-sight past walls and furniture, and "is the thief inside this cone".

// Do two segments (p1->p2 and p3->p4) cross? Standard orientation test.
export function segmentsCross(p1, p2, p3, p4) {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function direction(a, b, c) {
  return (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
}

// Does segment a->b hit rect r? Check the four edges.
export function segmentHitsRect(a, b, r) {
  const corners = [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h },
  ];
  for (let i = 0; i < 4; i += 1) {
    if (segmentsCross(a, b, corners[i], corners[(i + 1) % 4])) return true;
  }
  return false;
}

// True when nothing blocks the view from `from` to `to`.
export function hasLineOfSight(from, to, blockers) {
  for (const r of blockers) {
    if (segmentHitsRect(from, to, r)) return false;
  }
  return true;
}

// Smallest absolute angle between two headings, in radians.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

// Is `target` inside a vision cone cast from `origin` along `heading`?
// The cone has a range and a half-angle, and walls/furniture block the view.
export function insideCone(origin, heading, range, halfAngle, target, blockers) {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 4) return true;
  if (angleDiff(Math.atan2(dy, dx), heading) > halfAngle) return false;
  return hasLineOfSight(origin, target, blockers);
}

// Circle (px, py, radius) pushed out of rect r; returns the corrected centre.
export function pushCircleOutOfRect(px, py, radius, r) {
  const cx = Math.max(r.x, Math.min(px, r.x + r.w));
  const cy = Math.max(r.y, Math.min(py, r.y + r.h));
  const dx = px - cx;
  const dy = py - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= radius * radius) return { x: px, y: py };
  if (d2 === 0) {
    // Centre is inside the rect: push out along the shallowest side.
    const left = px - r.x;
    const right = r.x + r.w - px;
    const top = py - r.y;
    const bottom = r.y + r.h - py;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: r.x - radius, y: py };
    if (m === right) return { x: r.x + r.w + radius, y: py };
    if (m === top) return { x: px, y: r.y - radius };
    return { x: px, y: r.y + r.h + radius };
  }
  const d = Math.sqrt(d2);
  const push = (radius - d) / d;
  return { x: px + dx * push, y: py + dy * push };
}
