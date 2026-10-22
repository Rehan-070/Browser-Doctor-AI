const { build } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

// Helper to clean directories recursively
function cleanDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

// Programmatic zlib-based PNG generator for standard extension icons
function generateIconPng(width, height) {
  const buffer = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= r) {
        // Medical cross logo outline logic
        const inCross = (Math.abs(dx) < width * 0.18 && Math.abs(dy) < height * 0.45) ||
                        (Math.abs(dy) < height * 0.18 && Math.abs(dx) < width * 0.45);
        if (inCross) {
          // Inner Plus Symbol: Premium Off-White
          buffer[idx] = 255;
          buffer[idx + 1] = 255;
          buffer[idx + 2] = 255;
          buffer[idx + 3] = 255;
        } else {
          // Circle Background: Premium Emerald Green (#10b981)
          buffer[idx] = 16;
          buffer[idx + 1] = 185;
          buffer[idx + 2] = 129;
          buffer[idx + 3] = 255;
        }
      } else {
        // Transparent borders
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
      }
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeInt32BE(width, 0);
  ihdrData.writeInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = createChunk('IHDR', ihdrData);

  const scanlineLength = width * 4 + 1;
  const scanlines = Buffer.alloc(scanlineLength * height);
  for (let y = 0; y < height; y++) {
    scanlines[y * scanlineLength] = 0;
    buffer.copy(scanlines, y * scanlineLength + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(scanlines);
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcVal = zlib.crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

(async () => {
  try {
    const distPath = path.resolve(__dirname, 'dist');
    console.log('Cleaning output directory...');
    cleanDir(distPath);

    // 1. Build React Dashboard
    console.log('Building React Dashboard...');
    await build({
      configFile: false,
      root: path.resolve(__dirname, 'src/dashboard'),
      plugins: [react()],
      base: './', // Use relative paths for assets inside chrome extension
      build: {
        outDir: distPath,
        emptyOutDir: false,
        rollupOptions: {
          input: {
            dashboard: path.resolve(__dirname, 'src/dashboard/index.html')
          }
        }
      }
    });

    // 2. Build Background Service Worker
    console.log('Building Background Service Worker...');
    await build({
      configFile: false,
      build: {
        emptyOutDir: false,
        lib: {
          entry: path.resolve(__dirname, 'src/background/background.ts'),
          formats: ['iife'],
          name: 'background',
          fileName: () => 'background.js',
        },
        outDir: distPath,
        rollupOptions: {
          output: {
            extend: true
          }
        }
      }
    });

    // 3. Build Content Script
    console.log('Building Content Script...');
    await build({
      configFile: false,
      build: {
        emptyOutDir: false,
        lib: {
          entry: path.resolve(__dirname, 'src/content/content.ts'),
          formats: ['iife'],
          name: 'content',
          fileName: () => 'content.js',
        },
        outDir: distPath,
        rollupOptions: {
          output: {
            extend: true
          }
        }
      }
    });

    // 4. Copy manifest.json to dist
    console.log('Copying manifest.json...');
    fs.copyFileSync(
      path.resolve(__dirname, 'manifest.json'),
      path.resolve(distPath, 'manifest.json')
    );

    // 5. Generate PNG Icons in dist
    console.log('Generating PNG Icons...');
    const sizes = [16, 32, 48, 128];
    sizes.forEach(size => {
      const iconBuf = generateIconPng(size, size);
      fs.writeFileSync(path.resolve(distPath, `icon${size}.png`), iconBuf);
    });

    console.log('Extension built successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
})();
