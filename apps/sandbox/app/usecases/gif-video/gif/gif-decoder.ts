/**
 * A dependency-free GIF87a/89a parser: logical screen, color tables, graphic control extensions, and LZW-decoded frame
 * indices. It stops at palette indices rather than RGBA so a frame costs one byte per pixel until it is composited, and
 * so compositing rules (disposal, transparency) stay in one place, the frame source, instead of being baked into decode
 * output.
 *
 * Only the polyfill path uses this; where WebCodecs `ImageDecoder` can decode GIFs the browser does all of it.
 */

/** How the canvas is treated once a frame's delay has elapsed, per the GIF89a Graphic Control Extension. */
export const GifDisposal = {
  /** No disposal specified; treated like `leave`. */
  unspecified: 0,
  /** Leave the frame in place; the next frame draws over it. */
  leave: 1,
  /** Clear the frame's rectangle to the background, which browsers render as transparent. */
  restoreBackground: 2,
  /** Put back whatever the canvas held before this frame was drawn. */
  restorePrevious: 3,
} as const;

export type GifDisposalMethod = (typeof GifDisposal)[keyof typeof GifDisposal];

export interface GifFrame {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  /** Raw delay from the file in ms (hundredths of a second times ten); not yet normalized. */
  readonly delayMs: number;
  readonly disposal: GifDisposalMethod;
  /** Palette index that paints nothing, or -1 when the frame is opaque. */
  readonly transparentIndex: number;
  /** RGB triples, the local table when the frame has one and the global table otherwise. */
  readonly colorTable: Uint8Array;
  /** One palette index per pixel, row-major, already de-interlaced. */
  readonly indices: Uint8Array;
}

export interface ParsedGif {
  readonly width: number;
  readonly height: number;
  readonly frames: readonly GifFrame[];
  /** Times to play through, from the NETSCAPE2.0 extension: 0 means forever; absent means play once. */
  readonly loopCount: number | undefined;
}

const BLOCK_EXTENSION = 0x21;
const BLOCK_IMAGE = 0x2c;
const BLOCK_TRAILER = 0x3b;
const EXT_GRAPHIC_CONTROL = 0xf9;
const EXT_APPLICATION = 0xff;
const MAX_LZW_CODE_SIZE = 12;

/** The parts of a Graphic Control Extension a frame carries forward. */
interface GraphicControl {
  delayMs: number;
  disposal: GifDisposalMethod;
  transparentIndex: number;
}

const DEFAULT_GRAPHIC_CONTROL: GraphicControl = { delayMs: 0, disposal: GifDisposal.unspecified, transparentIndex: -1 };

class GifReader {
  readonly #bytes: Uint8Array;
  #pos = 0;

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
  }

  get position(): number {
    return this.#pos;
  }

  get remaining(): number {
    return this.#bytes.length - this.#pos;
  }

  u8(): number {
    const value = this.#bytes[this.#pos];
    if (value === undefined) throw new Error('Unexpected end of GIF data.');

    this.#pos += 1;

    return value;
  }

  u16(): number {
    const low = this.u8();
    const high = this.u8();

    return low | (high << 8);
  }

  bytes(length: number): Uint8Array {
    if (this.remaining < length) throw new Error('Unexpected end of GIF data.');

    const slice = this.#bytes.subarray(this.#pos, this.#pos + length);

    this.#pos += length;

    return slice;
  }

  /** Concatenate a run of length-prefixed sub-blocks up to and including the zero-length terminator. */
  subBlocks(): Uint8Array {
    const parts: Uint8Array[] = [];
    let total = 0;

    for (;;) {
      const length = this.u8();
      if (length === 0) break;

      const part = this.bytes(length);

      parts.push(part);
      total += length;
    }

    if (parts.length === 1) return parts[0]!;

    const joined = new Uint8Array(total);
    let offset = 0;

    for (const part of parts) {
      joined.set(part, offset);
      offset += part.length;
    }

    return joined;
  }

  skipSubBlocks(): void {
    for (;;) {
      const length = this.u8();
      if (length === 0) break;

      this.bytes(length);
    }
  }
}

function readColorTable(reader: GifReader, packed: number): Uint8Array {
  const entries = 1 << ((packed & 0x07) + 1);

  return reader.bytes(entries * 3);
}

/**
 * Decode one frame's LZW stream into palette indices. Codes are packed least significant bit first across the sub-block
 * bytes; the dictionary is kept as prefix/suffix tables so a code expands by walking back to its first byte, which is
 * also what seeds the `KwKwK` case.
 */
function decodeLzw(data: Uint8Array, minCodeSize: number, pixelCount: number): Uint8Array {
  const output = new Uint8Array(pixelCount);
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  const prefix = new Uint16Array(1 << MAX_LZW_CODE_SIZE);
  const suffix = new Uint8Array(1 << MAX_LZW_CODE_SIZE);
  const stack = new Uint8Array((1 << MAX_LZW_CODE_SIZE) + 1);

  let codeSize = minCodeSize + 1;
  let codeMask = (1 << codeSize) - 1;
  let nextCode = endCode + 1;
  let previous = -1;
  let first = 0;
  let out = 0;

  let bitBuffer = 0;
  let bitCount = 0;
  let pos = 0;

  for (let i = 0; i < clearCode; i++) {
    suffix[i] = i;
  }

  while (out < pixelCount) {
    while (bitCount < codeSize) {
      if (pos >= data.length) return output;

      bitBuffer |= data[pos]! << bitCount;
      bitCount += 8;
      pos += 1;
    }

    const code = bitBuffer & codeMask;

    bitBuffer >>>= codeSize;
    bitCount -= codeSize;

    if (code === clearCode) {
      codeSize = minCodeSize + 1;
      codeMask = (1 << codeSize) - 1;
      nextCode = endCode + 1;
      previous = -1;
      continue;
    }

    if (code === endCode) break;

    if (previous === -1) {
      output[out++] = suffix[code]!;
      previous = code;
      first = code;
      continue;
    }

    let current = code;
    let top = 0;

    if (code >= nextCode) {
      // KwKwK: the code being defined right now; it ends with the first byte of the previous expansion.
      stack[top++] = first;
      current = previous;
    }

    while (current >= clearCode) {
      stack[top++] = suffix[current]!;
      current = prefix[current]!;
    }

    first = suffix[current]!;
    stack[top++] = first;

    while (top > 0 && out < pixelCount) {
      output[out++] = stack[--top]!;
    }

    if (nextCode < 1 << MAX_LZW_CODE_SIZE) {
      prefix[nextCode] = previous;
      suffix[nextCode] = first;
      nextCode += 1;

      if (nextCode > codeMask && codeSize < MAX_LZW_CODE_SIZE) {
        codeSize += 1;
        codeMask = (1 << codeSize) - 1;
      }
    }

    previous = code;
  }

  return output;
}

/** Reorder interlaced rows (passes of every 8th, 8th offset 4, 4th offset 2, then 2nd offset 1) into scan order. */
function deinterlace(indices: Uint8Array, width: number, height: number): Uint8Array {
  const ordered = new Uint8Array(indices.length);
  const passes: [start: number, step: number][] = [
    [0, 8],
    [4, 8],
    [2, 4],
    [1, 2],
  ];
  let sourceRow = 0;

  for (const [start, step] of passes) {
    for (let row = start; row < height; row += step) {
      ordered.set(indices.subarray(sourceRow * width, (sourceRow + 1) * width), row * width);
      sourceRow += 1;
    }
  }

  return ordered;
}

/** The three-bit disposal field; values 4..7 are reserved and treated as `unspecified`. */
function toDisposalMethod(value: number): GifDisposalMethod {
  switch (value) {
    case GifDisposal.leave:
      return GifDisposal.leave;
    case GifDisposal.restoreBackground:
      return GifDisposal.restoreBackground;
    case GifDisposal.restorePrevious:
      return GifDisposal.restorePrevious;
    default:
      return GifDisposal.unspecified;
  }
}

function readGraphicControl(reader: GifReader): GraphicControl {
  const block = reader.subBlocks();
  if (block.length < 4) throw new Error('Malformed graphic control extension.');

  const packed = block[0]!;
  const delayHundredths = block[1]! | (block[2]! << 8);
  const hasTransparency = (packed & 0x01) !== 0;

  return {
    delayMs: delayHundredths * 10,
    disposal: toDisposalMethod((packed >> 2) & 0x07),
    transparentIndex: hasTransparency ? block[3]! : -1,
  };
}

/** The NETSCAPE2.0 / ANIMEXTS1.0 application extension carries the loop count; anything else is skipped. */
function readApplicationExtension(reader: GifReader): number | undefined {
  const block = reader.subBlocks();
  const identifier = String.fromCharCode(...block.subarray(0, 11));

  if ((identifier === 'NETSCAPE2.0' || identifier === 'ANIMEXTS1.0') && block.length >= 14 && block[11] === 1) {
    return block[12]! | (block[13]! << 8);
  }

  return undefined;
}

/** Parse a whole GIF file. Throws on anything that is not a GIF or that ends mid-structure. */
export function parseGif(buffer: ArrayBuffer | Uint8Array): ParsedGif {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const signature = String.fromCharCode(...bytes.subarray(0, 6));
  if (signature !== 'GIF87a' && signature !== 'GIF89a') throw new Error('Not a GIF file.');

  const reader = new GifReader(bytes);

  reader.bytes(6);

  const width = reader.u16();
  const height = reader.u16();
  const screenPacked = reader.u8();

  reader.u8(); // background color index; browsers composite onto transparent regardless
  reader.u8(); // pixel aspect ratio; ignored like browsers do

  const globalColorTable = screenPacked & 0x80 ? readColorTable(reader, screenPacked) : new Uint8Array(0);
  const frames: GifFrame[] = [];
  let loopCount: number | undefined;
  let control: GraphicControl = DEFAULT_GRAPHIC_CONTROL;

  while (reader.remaining > 0) {
    const blockType = reader.u8();
    if (blockType === BLOCK_TRAILER) break;

    if (blockType === BLOCK_EXTENSION) {
      const label = reader.u8();

      if (label === EXT_GRAPHIC_CONTROL) {
        control = readGraphicControl(reader);
      } else if (label === EXT_APPLICATION) {
        loopCount = readApplicationExtension(reader) ?? loopCount;
      } else {
        reader.skipSubBlocks();
      }

      continue;
    }

    if (blockType !== BLOCK_IMAGE) throw new Error(`Unknown GIF block 0x${blockType.toString(16)}.`);

    const left = reader.u16();
    const top = reader.u16();
    const frameWidth = reader.u16();
    const frameHeight = reader.u16();
    const imagePacked = reader.u8();
    const colorTable = imagePacked & 0x80 ? readColorTable(reader, imagePacked) : globalColorTable;
    const interlaced = (imagePacked & 0x40) !== 0;
    const minCodeSize = reader.u8();
    if (minCodeSize < 2 || minCodeSize > 11) throw new Error('Malformed LZW minimum code size.');

    const pixelCount = frameWidth * frameHeight;
    const decoded = decodeLzw(reader.subBlocks(), minCodeSize, pixelCount);

    frames.push({
      left,
      top,
      width: frameWidth,
      height: frameHeight,
      delayMs: control.delayMs,
      disposal: control.disposal,
      transparentIndex: control.transparentIndex,
      colorTable,
      indices: interlaced ? deinterlace(decoded, frameWidth, frameHeight) : decoded,
    });

    // A Graphic Control Extension applies to the one image that follows it.
    control = DEFAULT_GRAPHIC_CONTROL;
  }

  if (frames.length === 0) throw new Error('GIF contains no frames.');

  return { width, height, frames, loopCount };
}
