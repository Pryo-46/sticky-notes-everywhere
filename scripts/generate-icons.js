// Simple PNG icon generator using pure JavaScript
// Creates minimal valid PNG files for the extension icons

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CRC32 table for PNG
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const length = data.length;
  const chunk = new Uint8Array(12 + length);

  // Length (4 bytes, big-endian)
  chunk[0] = (length >> 24) & 0xff;
  chunk[1] = (length >> 16) & 0xff;
  chunk[2] = (length >> 8) & 0xff;
  chunk[3] = length & 0xff;

  // Type (4 bytes)
  chunk.set(typeBytes, 4);

  // Data
  chunk.set(data, 8);

  // CRC (4 bytes)
  const crcData = new Uint8Array(4 + length);
  crcData.set(typeBytes, 0);
  crcData.set(data, 4);
  const crcValue = crc32(crcData);
  chunk[8 + length] = (crcValue >> 24) & 0xff;
  chunk[9 + length] = (crcValue >> 16) & 0xff;
  chunk[10 + length] = (crcValue >> 8) & 0xff;
  chunk[11 + length] = crcValue & 0xff;

  return chunk;
}

function adler32(data) {
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return (b << 16) | a;
}

function deflateStore(data) {
  // Simple "store" compression (no actual compression)
  const maxBlockSize = 65535;
  const blocks = [];

  for (let i = 0; i < data.length; i += maxBlockSize) {
    const isLast = i + maxBlockSize >= data.length;
    const blockData = data.slice(i, Math.min(i + maxBlockSize, data.length));
    const len = blockData.length;

    const block = new Uint8Array(5 + len);
    block[0] = isLast ? 0x01 : 0x00;
    block[1] = len & 0xff;
    block[2] = (len >> 8) & 0xff;
    block[3] = ~len & 0xff;
    block[4] = (~len >> 8) & 0xff;
    block.set(blockData, 5);
    blocks.push(block);
  }

  // Calculate total length
  let totalLen = 2; // zlib header
  for (const block of blocks) {
    totalLen += block.length;
  }
  totalLen += 4; // adler32

  const result = new Uint8Array(totalLen);
  result[0] = 0x78; // CMF
  result[1] = 0x01; // FLG (no dict, fastest compression)

  let offset = 2;
  for (const block of blocks) {
    result.set(block, offset);
    offset += block.length;
  }

  const adler = adler32(data);
  result[offset] = (adler >> 24) & 0xff;
  result[offset + 1] = (adler >> 16) & 0xff;
  result[offset + 2] = (adler >> 8) & 0xff;
  result[offset + 3] = adler & 0xff;

  return result;
}

function createPNG(size) {
  const width = size;
  const height = size;

  // Create image data (RGBA)
  const rawData = new Uint8Array((width * 4 + 1) * height);

  // Yellow sticky note with folded corner
  const bgColor = [255, 212, 59, 255]; // #ffd43b
  const foldColor = [240, 200, 0, 255]; // Darker yellow for fold
  const lineColor = [102, 102, 102, 255]; // #666

  const cornerSize = Math.floor(size * 0.25);
  const margin = Math.floor(size * 0.15);
  const lineHeight = Math.floor(size * 0.2);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    rawData[rowStart] = 0; // Filter byte

    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 4;

      // Check if in corner fold area
      const inCorner = x > width - cornerSize && y < cornerSize;
      const onFoldDiagonal = Math.abs((width - x) - y) < 2;

      // Check if on line
      const lineY1 = Math.floor(height * 0.3);
      const lineY2 = Math.floor(height * 0.5);
      const lineY3 = Math.floor(height * 0.7);
      const onLine = (Math.abs(y - lineY1) < 1 || Math.abs(y - lineY2) < 1 || Math.abs(y - lineY3) < 1)
                     && x >= margin && x <= width - margin - (y < cornerSize ? cornerSize : 0);

      let color;
      if (inCorner && !onFoldDiagonal) {
        color = foldColor;
      } else if (onLine) {
        color = lineColor;
      } else {
        color = bgColor;
      }

      rawData[pixelStart] = color[0];
      rawData[pixelStart + 1] = color[1];
      rawData[pixelStart + 2] = color[2];
      rawData[pixelStart + 3] = color[3];
    }
  }

  // PNG signature
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = new Uint8Array(13);
  ihdrData[0] = (width >> 24) & 0xff;
  ihdrData[1] = (width >> 16) & 0xff;
  ihdrData[2] = (width >> 8) & 0xff;
  ihdrData[3] = width & 0xff;
  ihdrData[4] = (height >> 24) & 0xff;
  ihdrData[5] = (height >> 16) & 0xff;
  ihdrData[6] = (height >> 8) & 0xff;
  ihdrData[7] = height & 0xff;
  ihdrData[8] = 8;  // Bit depth
  ihdrData[9] = 6;  // Color type (RGBA)
  ihdrData[10] = 0; // Compression method
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // Interlace method
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const compressedData = deflateStore(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', new Uint8Array(0));

  // Combine all parts
  const png = new Uint8Array(signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length);
  let offset = 0;
  png.set(signature, offset); offset += signature.length;
  png.set(ihdrChunk, offset); offset += ihdrChunk.length;
  png.set(idatChunk, offset); offset += idatChunk.length;
  png.set(iendChunk, offset);

  return png;
}

// Generate icons
const sizes = [16, 48, 128];
const iconsDir = join(__dirname, '..', 'public', 'icons');

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

for (const size of sizes) {
  const png = createPNG(size);
  const filename = join(iconsDir, `icon${size}.png`);
  writeFileSync(filename, png);
  console.log(`Created ${filename}`);
}

console.log('Icon generation complete!');
