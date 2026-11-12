import { clamp } from '@videojs/utils/number';

import type { ChartMedia } from './chart-media';
import { BACKDROP, BOARD, CHROME, EMBERS, FOG, FRETS, GEM, LANES, STRIKE, TAIL, TARGET } from './highway-theme';

/** Seconds of chart in view above the strike line. */
const LOOK_AHEAD = 1.5;
/** Seconds a passed note takes to fade out below the strike line. */
const FADE_OUT = 0.15;
/** How wide the far end of the highway is, next to the near end. */
const FAR_SCALE = 0.3;
/** Where the board ends nearest the player: past the bottom edge. */
const NEAR = -FADE_OUT * 1.5;

/** Opacity for a note `seconds` from the strike line: solid ahead of it, fading out once past. */
function fade(seconds: number): number {
  return clamp(1 + seconds / FADE_OUT, 0, 1);
}

/** Draws the scrolling note highway every frame, from wherever the media's clock is. */
export class Highway {
  #canvas: HTMLCanvasElement;
  #context: CanvasRenderingContext2D;
  #media: ChartMedia;
  #frame = 0;
  #ember = emberSprite();
  #reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Layout, in canvas pixels, refreshed every frame so a resize just works.
  #width = 0;
  #height = 0;
  #strikeY = 0;
  #vanishY = 0;
  #laneWidth = 0;

  constructor(canvas: HTMLCanvasElement, media: ChartMedia) {
    this.#canvas = canvas;
    this.#context = canvas.getContext('2d')!;
    this.#media = media;
    this.#draw();
  }

  destroy(): void {
    cancelAnimationFrame(this.#frame);
  }

  #draw = (): void => {
    this.#frame = requestAnimationFrame(this.#draw);

    const time = this.#media.currentTime;
    const notes = this.#media.notes;
    const drums = this.#media.part?.instrument === 'drums';

    this.#layout();
    this.#drawBackdrop();

    if (!this.#reducedMotion.matches) this.#drawEmbers(performance.now() / 1000);

    this.#drawBoard(time);
    this.#drawTargets();

    // Far notes first, so near ones overlap them.
    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i]!;
      const from = note.time - time;
      const to = from + note.length;
      if (from > LOOK_AHEAD || to < -FADE_OUT) continue;

      if (note.length > 0) {
        this.#context.globalAlpha = fade(to);
        this.#drawTail(note.lane, Math.max(from, 0), Math.min(to, LOOK_AHEAD));
      }

      // A held note's gem has long gone by, and the perspective can't place it any nearer.
      if (from < -FADE_OUT) continue;

      this.#context.globalAlpha = fade(from);

      // On drums, lane 0 is the kick pedal: a bar across the whole highway.
      if (drums && note.lane === 0) this.#drawKick(from);
      else this.#drawGem(note.lane, from);
    }

    this.#context.globalAlpha = 1;
    this.#drawFog();
  };

  #layout(): void {
    this.#width = this.#canvas.width;
    this.#height = this.#canvas.height;
    this.#strikeY = this.#height * 0.86;
    this.#laneWidth = Math.min(this.#width * 0.9, this.#height * 0.9) / 5;

    // Place the vanishing point so that `LOOK_AHEAD` lands near the top edge.
    const topY = this.#height * 0.03;

    this.#vanishY = (topY - FAR_SCALE * this.#strikeY) / (1 - FAR_SCALE);
  }

  /** Perspective scale for a moment `seconds` from now: 1 on the strike line, `FAR_SCALE` at the look-ahead. */
  #scale(seconds: number): number {
    return 1 / (1 + (seconds / LOOK_AHEAD) * (1 / FAR_SCALE - 1));
  }

  #y(seconds: number): number {
    return this.#vanishY + (this.#strikeY - this.#vanishY) * this.#scale(seconds);
  }

  /** The x of a lane's center (or edge, for fractional lanes) at a moment `seconds` from now. */
  #x(lane: number, seconds: number): number {
    return this.#width / 2 + (lane - 2) * this.#laneWidth * this.#scale(seconds);
  }

  // ----------------------------------------
  // Stage
  // ----------------------------------------

  /** Smoky black, with fire glowing up from below and the corners falling away. */
  #drawBackdrop(): void {
    const ctx = this.#context;
    const sky = ctx.createLinearGradient(0, 0, 0, this.#height);

    sky.addColorStop(0, BACKDROP.top);
    sky.addColorStop(0.55, BACKDROP.middle);
    sky.addColorStop(1, BACKDROP.bottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.#width, this.#height);

    this.#glow(this.#width / 2, this.#height * 1.1, this.#width * 0.6, this.#height * 0.7, BACKDROP.fire);

    const vignette = ctx.createRadialGradient(
      this.#width / 2,
      this.#height * 0.6,
      this.#height * 0.35,
      this.#width / 2,
      this.#height * 0.6,
      this.#width * 0.7
    );

    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(1, BACKDROP.vignette);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.#width, this.#height);
  }

  /** Sparks rising either side of the highway, on the wall clock so they drift even while paused. */
  #drawEmbers(now: number): void {
    const ctx = this.#context;
    const [slow, fast] = EMBERS.speed;
    const [small, big] = EMBERS.size;

    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < EMBERS.count; i++) {
      const rise = (now * (slow + random(i, 1) * (fast - slow)) + random(i, 2)) % 1;
      const size = this.#height * (small + random(i, 3) * (big - small)) * 6;
      const x = this.#width * random(i, 4) + Math.sin(now * 0.7 + i) * this.#height * 0.03;
      const y = this.#height * (1.04 - rise * 1.1);
      const flicker = 0.6 + 0.4 * Math.sin(now * 9 + i * 1.7);

      ctx.globalAlpha = Math.min(1, rise * 12) * (1 - rise) * flicker;
      ctx.drawImage(this.#ember, x - size / 2, y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /** A smoke bank swallowing the far end, so notes emerge from it. */
  #drawFog(): void {
    const ctx = this.#context;
    const [r, g, b] = FOG.color;
    const end = this.#y(LOOK_AHEAD * (1 - FOG.reach));
    const fog = ctx.createLinearGradient(0, 0, 0, end);

    fog.addColorStop(0, `rgb(${r} ${g} ${b})`);
    fog.addColorStop(0.3, `rgb(${r} ${g} ${b} / 0.9)`);
    fog.addColorStop(0.7, `rgb(${r} ${g} ${b} / 0.35)`);
    fog.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, this.#width, end);

    this.#glow(this.#width / 2, this.#y(LOOK_AHEAD), this.#laneWidth * 3, this.#laneWidth * 0.9, FOG.haze);
  }

  // ----------------------------------------
  // Board
  // ----------------------------------------

  #drawBoard(time: number): void {
    const ctx = this.#context;
    const top = this.#y(LOOK_AHEAD);

    const wood = ctx.createLinearGradient(0, top, 0, this.#height);

    wood.addColorStop(0, BOARD.far);
    wood.addColorStop(0.65, BOARD.near);
    wood.addColorStop(1, BOARD.under);
    ctx.fillStyle = wood;
    this.#quad(-0.5, 4.5, LOOK_AHEAD, NEAR);

    for (const streak of GRAIN) {
      ctx.strokeStyle = streak.color;
      ctx.lineWidth = this.#laneWidth * streak.width;
      this.#line(streak.lane);
    }

    // Charred along the rails.
    const char = ctx.createLinearGradient(this.#x(-0.5, 0), 0, this.#x(4.5, 0), 0);

    char.addColorStop(0, BOARD.char);
    char.addColorStop(0.14, 'transparent');
    char.addColorStop(0.86, 'transparent');
    char.addColorStop(1, BOARD.char);
    ctx.fillStyle = char;
    this.#quad(-0.5, 4.5, LOOK_AHEAD, NEAR);

    this.#drawFrets(time);
    this.#drawDividers();
    this.#drawRails();
    this.#drawStrikeLine();
  }

  /** Fret wires, one a beat and a heavier one a bar, scrolling down with the notes. */
  #drawFrets(time: number): void {
    const ctx = this.#context;
    const first = Math.ceil((time + NEAR) / FRETS.beat);
    const last = Math.floor((time + LOOK_AHEAD) / FRETS.beat);

    for (let beat = first; beat <= last; beat++) {
      const seconds = beat * FRETS.beat - time;
      const bar = beat % FRETS.beatsPerBar === 0;
      const thickness = this.#laneWidth * (bar ? FRETS.barWidth : FRETS.width) * this.#scale(seconds);
      const left = this.#x(-0.5, seconds);
      const width = this.#x(4.5, seconds) - left;
      const y = this.#y(seconds);

      ctx.fillStyle = FRETS.shadow;
      ctx.fillRect(left, y, width, thickness);
      ctx.fillStyle = bar ? FRETS.barColor : FRETS.color;
      ctx.fillRect(left, y - thickness, width, thickness);
    }
  }

  /** Glowing wires between the lanes, brightening toward the strike line. */
  #drawDividers(): void {
    const ctx = this.#context;
    const { glow, core, width, coreWidth } = BOARD.divider;

    for (const [color, lineWidth] of [
      [glow, width],
      [core, coreWidth],
    ] as const) {
      const fade = ctx.createLinearGradient(0, this.#y(LOOK_AHEAD), 0, this.#strikeY);

      fade.addColorStop(0, 'transparent');
      fade.addColorStop(1, color);
      ctx.strokeStyle = fade;
      ctx.lineWidth = Math.max(1, this.#laneWidth * lineWidth);

      for (let edge = 0.5; edge < 4.5; edge++) this.#line(edge);
    }
  }

  /** Chrome rails down both sides, with fire reflected along their inner edge. */
  #drawRails(): void {
    const ctx = this.#context;
    const steel = ctx.createLinearGradient(0, this.#y(LOOK_AHEAD), 0, this.#height);

    steel.addColorStop(0, '#0d0e10');
    steel.addColorStop(0.55, '#4b525b');
    steel.addColorStop(0.8, '#d9dfe6');
    steel.addColorStop(1, '#6f7781');
    ctx.fillStyle = steel;
    this.#quad(-0.5 - BOARD.rail, -0.5, LOOK_AHEAD, NEAR);
    this.#quad(4.5, 4.5 + BOARD.rail, LOOK_AHEAD, NEAR);

    ctx.strokeStyle = BOARD.railGlow;
    ctx.lineWidth = Math.max(1, this.#laneWidth * 0.025);
    this.#line(-0.5);
    this.#line(4.5);
  }

  /** A bar of hot metal across the board. */
  #drawStrikeLine(): void {
    const ctx = this.#context;
    const left = this.#x(-0.5 - BOARD.rail, 0);
    const right = this.#x(4.5 + BOARD.rail, 0);
    const height = this.#laneWidth * STRIKE.height;
    const top = this.#strikeY - height / 2;

    this.#glow(this.#width / 2, this.#strikeY, (right - left) * 0.6, height * 3, STRIKE.glow);

    const metal = ctx.createLinearGradient(0, top, 0, top + height);

    for (const [offset, color] of STRIKE.stops) metal.addColorStop(offset, color);

    ctx.fillStyle = metal;
    ctx.fillRect(left, top, right - left, height);
  }

  /** A chrome bezel in each lane on the strike line, a ring of the lane's color inside it, and a dark well. */
  #drawTargets(): void {
    const ctx = this.#context;
    const radius = this.#laneWidth * TARGET.radius;
    const squash = GEM.squash;
    const y = this.#strikeY;

    for (let lane = 0; lane < 5; lane++) {
      const paint = LANES[lane]!;
      const x = this.#x(lane, 0);

      this.#glow(x, y, radius * 1.6, radius * squash * 1.6, paint.glow);

      ctx.fillStyle = this.#chrome(y - radius * squash, y + radius * squash);
      ellipse(ctx, x, y, radius, radius * squash);

      const ring = ctx.createLinearGradient(0, y - radius * squash, 0, y + radius * squash);

      ring.addColorStop(0, paint.light);
      ring.addColorStop(0.35, paint.base);
      ring.addColorStop(1, paint.dark);
      ctx.fillStyle = ring;
      ellipse(ctx, x, y, radius * 0.84, radius * squash * 0.82);

      const well = ctx.createRadialGradient(x, y + radius * squash * 0.4, 0, x, y, radius * 0.7);

      well.addColorStop(0, TARGET.wellLight);
      well.addColorStop(1, TARGET.well);
      ctx.fillStyle = well;
      ellipse(ctx, x, y + radius * squash * 0.05, radius * 0.62, radius * squash * 0.58);
    }
  }

  // ----------------------------------------
  // Notes
  // ----------------------------------------

  /** A sustain: a glowing ribbon of the lane's color with a white-hot core. */
  #drawTail(lane: number, from: number, to: number): void {
    const ctx = this.#context;
    const paint = LANES[lane]!;

    ctx.shadowColor = paint.base;
    ctx.shadowBlur = this.#laneWidth * 0.3;
    ctx.fillStyle = paint.glow;
    this.#quad(lane - TAIL.glow, lane + TAIL.glow, to, from);
    ctx.shadowBlur = 0;

    ctx.fillStyle = paint.base;
    this.#quad(lane - TAIL.body, lane + TAIL.body, to, from);
    ctx.fillStyle = paint.light;
    this.#quad(lane - TAIL.core, lane + TAIL.core, to, from);
  }

  /** A glossy dome of the lane's color in a chrome cup, with a steel button at its center. */
  #drawGem(lane: number, seconds: number): void {
    const ctx = this.#context;
    const paint = LANES[lane]!;
    const radius = this.#laneWidth * GEM.radius * this.#scale(seconds);
    const ry = radius * GEM.squash;
    const x = this.#x(lane, seconds);
    const y = this.#y(seconds);

    this.#glow(x, y, radius * 1.5, ry * 1.5, paint.glow);

    // A shadow and a dark steel base lift the gem off the board.
    ctx.fillStyle = GEM.shadow;
    ellipse(ctx, x, y + ry * 0.5, radius * 1.05, ry);
    ctx.fillStyle = '#16181c';
    ellipse(ctx, x, y + ry * 0.24, radius, ry);

    ctx.fillStyle = this.#chrome(y - ry, y + ry);
    ellipse(ctx, x, y, radius, ry);

    const dome = ctx.createRadialGradient(x - radius * 0.3, y - ry * 0.55, 0, x, y, radius * 0.9);

    dome.addColorStop(0, paint.light);
    dome.addColorStop(0.3, paint.base);
    dome.addColorStop(1, paint.dark);
    ctx.fillStyle = dome;
    ellipse(ctx, x, y - ry * 0.05, radius * 0.8, ry * 0.76);

    const button = ctx.createRadialGradient(x - radius * 0.08, y - ry * 0.25, 0, x, y - ry * 0.05, radius * 0.3);

    button.addColorStop(0, '#ffffff');
    button.addColorStop(0.55, '#cfd5dc');
    button.addColorStop(1, '#4d545d');
    ctx.fillStyle = button;
    ellipse(ctx, x, y - ry * 0.05, radius * 0.28, ry * 0.28);

    ctx.fillStyle = GEM.specular;
    ellipse(ctx, x - radius * 0.38, y - ry * 0.42, radius * 0.2, ry * 0.15);
  }

  #drawKick(seconds: number): void {
    const ctx = this.#context;
    const paint = LANES[4]!;
    const half = 0.03;
    const metal = ctx.createLinearGradient(0, this.#y(seconds + half), 0, this.#y(seconds - half));

    metal.addColorStop(0, paint.light);
    metal.addColorStop(0.45, paint.base);
    metal.addColorStop(1, paint.dark);
    ctx.fillStyle = metal;
    this.#quad(-0.4, 4.4, seconds + half, seconds - half);
  }

  // ----------------------------------------
  // Helpers
  // ----------------------------------------

  /** Fill the stretch of highway between lanes `left` and `right`, from `far` to `near` seconds away. */
  #quad(left: number, right: number, far: number, near: number): void {
    const ctx = this.#context;

    ctx.beginPath();
    ctx.moveTo(this.#x(left, far), this.#y(far));
    ctx.lineTo(this.#x(right, far), this.#y(far));
    ctx.lineTo(this.#x(right, near), this.#y(near));
    ctx.lineTo(this.#x(left, near), this.#y(near));
    ctx.fill();
  }

  /** Stroke a line down the whole board at `lane`, following the perspective. */
  #line(lane: number): void {
    const ctx = this.#context;

    ctx.beginPath();
    ctx.moveTo(this.#x(lane, LOOK_AHEAD), this.#y(LOOK_AHEAD));
    ctx.lineTo(this.#x(lane, NEAR), this.#y(NEAR));
    ctx.stroke();
  }

  /** Polished steel between `top` and `bottom`. */
  #chrome(top: number, bottom: number): CanvasGradient {
    const chrome = this.#context.createLinearGradient(0, top, 0, bottom);

    for (const [offset, color] of CHROME) chrome.addColorStop(offset, color);

    return chrome;
  }

  /** Add a soft elliptical glow of `color` around a point. */
  #glow(x: number, y: number, rx: number, ry: number, color: string): void {
    const ctx = this.#context;
    const light = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);

    light.addColorStop(0, color);
    light.addColorStop(1, 'transparent');

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = light;
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
    ctx.restore();
  }
}

/** Streaks of grain at fixed spots across the board, so they run with the perspective. */
const GRAIN = Array.from({ length: BOARD.grain.count }, (_, i) => {
  const { light, dark, alpha } = BOARD.grain;
  const [r, g, b] = i % 3 ? dark : light;

  return {
    lane: -0.5 + random(i, 1) * 5,
    width: 0.004 + random(i, 2) * 0.03,
    color: `rgb(${r} ${g} ${b} / ${alpha * (0.4 + random(i, 3) * 1.6)})`,
  };
});

/** A soft spark, drawn once and stamped for every ember. */
function emberSprite(): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  const size = 64;
  const ctx = sprite.getContext('2d')!;

  sprite.width = sprite.height = size;

  const spark = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

  spark.addColorStop(0, EMBERS.core);
  spark.addColorStop(0.15, EMBERS.hot);
  spark.addColorStop(1, EMBERS.cool);
  ctx.fillStyle = spark;
  ctx.fillRect(0, 0, size, size);

  return sprite;
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A stable pseudo-random number in [0, 1) for item `i`'s `n`th property, so the scenery holds still between frames. */
function random(i: number, n: number): number {
  const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;

  return x - Math.floor(x);
}
