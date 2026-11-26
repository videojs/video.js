/**
 * A small GIF89a encoder for test fixtures. Frames are palette indices, so a test states exactly which pixel is which
 * color and what the file says about delay, disposal, transparency, and interlacing — the parts the decoder has to get
 * right — without a binary fixture nobody can read.
 */

export interface GifFixtureFrame {
  /** One palette index per pixel, row-major, `width * height` long. */
  indices: number[];
  width: number;
  height: number;
  left?: number;
  top?: number;
  /** Delay in hundredths of a second, as the file stores it. */
  delay?: number;
  /** Disposal method 0..3. */
  disposal?: number;
  transparentIndex?: number;
  /** RGB triples for a local color table; the global one applies otherwise. */
  colorTable?: number[];
  interlaced?: boolean;
  /** Leave out the Graphic Control Extension entirely. */
  noGraphicControl?: boolean;
}

export interface GifFixture {
  width: number;
  height: number;
  /** RGB triples; the global color table. */
  colorTable: number[];
  frames: GifFixtureFrame[];
  /** Adds a NETSCAPE2.0 loop block when set; 0 loops forever. */
  loopCount?: number;
  /** Extra extension blocks to splice in before the first frame, for coverage of skipped block types. */
  extraExtensions?: number[][];
}

function u16(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff];
}

/** Round a color table up to a power of two of at least 2 entries and return `[bytes, sizeField]`. */
function colorTableBytes(table: number[]): [number[], number] {
  const entries = Math.max(2, table.length / 3);
  let sizeField = 0;

  while (1 << (sizeField + 1) < entries) sizeField += 1;

  const padded = table.slice();

  while (padded.length < (1 << (sizeField + 1)) * 3) padded.push(0);

  return [padded, sizeField];
}

/** Rows in the order an interlaced file stores them. */
function interlaceRows(indices: number[], width: number, height: number): number[] {
  const out: number[] = [];

  for (const [start, step] of [
    [0, 8],
    [4, 8],
    [2, 4],
    [1, 2],
  ] as const) {
    for (let row = start; row < height; row += step) {
      out.push(...indices.slice(row * width, (row + 1) * width));
    }
  }

  return out;
}

/** Variable-code-size LZW with the GIF conventions: clear first, end-of-information last, codes packed LSB first. */
function encodeLzw(indices: number[], minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  const out: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;
  let codeSize = minCodeSize + 1;
  let dictionary = new Map<string, number>();
  let nextCode = endCode + 1;

  const emit = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;

    while (bitCount >= 8) {
      out.push(bitBuffer & 0xff);
      bitBuffer >>>= 8;
      bitCount -= 8;
    }
  };

  const reset = () => {
    dictionary = new Map();
    nextCode = endCode + 1;
    codeSize = minCodeSize + 1;
  };

  emit(clearCode);

  let phrase = '';

  for (const index of indices) {
    const candidate = phrase ? `${phrase},${index}` : String(index);

    if (phrase === '' || dictionary.has(candidate)) {
      phrase = candidate;
      continue;
    }

    emit(dictionary.get(phrase) ?? Number(phrase));

    if (nextCode < 4096) {
      dictionary.set(candidate, nextCode);
      nextCode += 1;

      if (nextCode - 1 === 1 << codeSize && codeSize < 12) codeSize += 1;
    } else {
      emit(clearCode);
      reset();
    }

    phrase = String(index);
  }

  if (phrase !== '') emit(dictionary.get(phrase) ?? Number(phrase));

  emit(endCode);

  if (bitCount > 0) out.push(bitBuffer & 0xff);

  return out;
}

function subBlocks(data: number[]): number[] {
  const out: number[] = [];

  for (let i = 0; i < data.length; i += 255) {
    const chunk = data.slice(i, i + 255);

    out.push(chunk.length, ...chunk);
  }

  out.push(0);

  return out;
}

export function encodeGif(fixture: GifFixture): Uint8Array<ArrayBuffer> {
  const bytes: number[] = [...'GIF89a'].map((c) => c.charCodeAt(0));
  const [globalTable, globalSize] = colorTableBytes(fixture.colorTable);

  bytes.push(...u16(fixture.width), ...u16(fixture.height), 0x80 | globalSize, 0, 0, ...globalTable);

  if (fixture.loopCount !== undefined) {
    bytes.push(0x21, 0xff, 11, ...[...'NETSCAPE2.0'].map((c) => c.charCodeAt(0)), 3, 1, ...u16(fixture.loopCount), 0);
  }

  for (const extension of fixture.extraExtensions ?? []) bytes.push(...extension);

  for (const frame of fixture.frames) {
    if (!frame.noGraphicControl) {
      const transparent = frame.transparentIndex !== undefined;
      const packed = ((frame.disposal ?? 0) << 2) | (transparent ? 1 : 0);

      bytes.push(0x21, 0xf9, 4, packed, ...u16(frame.delay ?? 0), frame.transparentIndex ?? 0, 0);
    }

    const [localTable, localSize] = frame.colorTable ? colorTableBytes(frame.colorTable) : [[], 0];
    const packed = (frame.colorTable ? 0x80 | localSize : 0) | (frame.interlaced ? 0x40 : 0);

    bytes.push(
      0x2c,
      ...u16(frame.left ?? 0),
      ...u16(frame.top ?? 0),
      ...u16(frame.width),
      ...u16(frame.height),
      packed
    );
    bytes.push(...localTable);

    const tableSize = frame.colorTable ? localSize : globalSize;
    const minCodeSize = Math.max(2, tableSize + 1);
    const indices = frame.interlaced ? interlaceRows(frame.indices, frame.width, frame.height) : frame.indices;

    bytes.push(minCodeSize, ...subBlocks(encodeLzw(indices, minCodeSize)));
  }

  bytes.push(0x3b);

  return new Uint8Array(bytes);
}

/** A comment extension block, the kind a decoder must skip. */
export function commentExtension(text: string): number[] {
  return [0x21, 0xfe, text.length, ...[...text].map((c) => c.charCodeAt(0)), 0];
}

export const RED = [255, 0, 0];
export const GREEN = [0, 255, 0];
export const BLUE = [0, 0, 255];
export const WHITE = [255, 255, 255];

/** Read the RGBA pixel at `(x, y)` out of a composited buffer. */
export function pixelAt(pixels: Uint8ClampedArray, width: number, x: number, y: number): number[] {
  const offset = (y * width + x) * 4;

  return [...pixels.subarray(offset, offset + 4)];
}
