/**
 * Flash Buffer Benchmarks
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 */
/* Import required modules */
import { Bench } from 'tinybench';
import { FlashBuffer, FlashBufferPool } from '../src';

// Create benchmark
const bench = new Bench({ time: 1000 });

// Set 1m iterations
const iterations = 1_000_000;

// Values for Benchmark
const values = Array.from({ length: iterations }, () => Math.floor(Math.random() * 0xFFFFFFFF));
const strings = [
    'short',
    'medium length string with some content',
    'a somewhat longer string that contains some Unicode characters like 你好, привет, 😊, and is long enough to test performance.',
];

/* Prepare buffer with many strings */
const writeBuf = new FlashBuffer({ initialSize: iterations * 30 });
for (let i = 0; i < iterations; i++) {
    writeBuf.writeCString(strings[i % strings.length]);
}
const readBuf = writeBuf.slice();

/* Buffer sizes */
const sizes = [16, 32, 64, 128, 256, 512, 1024];

/**
 * Create benchmarks
 */
bench
    .add('BinaryBuffer write+read uint32', () => {
        const buf = new FlashBuffer({ initialSize: iterations * 4 });
        for (let i = 0; i < iterations; i++) {
            buf.writeUint32(i, true);
        }
        buf.reset();
        let sum = 0;
        for (let i = 0; i < iterations; i++) {
            sum += buf.readUint32(true);
        }
    })
    .add('Manual DataView (fixed buffer, manual offset)', () => {
        const buffer = new ArrayBuffer(iterations * 4);
        const view = new DataView(buffer);
        let offset = 0;
        for (let i = 0; i < iterations; i++) {
            view.setUint32(offset, i, true);
            offset += 4;
        }
        offset = 0;
        let sum = 0;
        for (let i = 0; i < iterations; i++) {
            sum += view.getUint32(offset, true);
            offset += 4;
        }
    })
    .add('BinaryBuffer writeString + readString (no prefix)', () => {
        const str = 'benchmark string';
        const buf = new FlashBuffer({ initialSize: 1024 });
        for (let i = 0; i < 10_000; i++) {
            buf.writeString(str).reset();
            buf.readString(str.length);
            buf.reset();
        }
    })
    .add('writeVarUint', () => {
        const buf = new FlashBuffer({ initialSize: iterations * 5 });
        for (let i = 0; i < iterations; i++) {
            buf.writeVarUint(values[i]);
        }
    })
    .add('readVarUint', () => {
        const buf = new FlashBuffer({ initialSize: iterations * 5 });
        for (let i = 0; i < iterations; i++) {
            buf.writeVarUint(values[i]);
        }
        buf.reset();
        return () => {
            for (let i = 0; i < iterations; i++) {
                buf.readVarUint();
            }
        };
    })
    .add('write C-string', () => {
        const buf = new FlashBuffer({ initialSize: 1024 });
        for (let i = 0; i < iterations; i++) {
            buf.writeCString(strings[i % strings.length]);
        }
    })
    .add('read C-string', () => {
        readBuf.reset();
        for (let i = 0; i < iterations; i++) {
            readBuf.readCString();
        }
    })
    .add('new ArrayBuffer (no pool)', () => {
        for (let i = 0; i < iterations; i++) {
            const size = sizes[i % sizes.length];
            const buf = new ArrayBuffer(size);
            // имитация использования
            new Uint8Array(buf)[0] = 1;
        }
    })
    .add('BufferPool (acquire/release)', () => {
        const pool = new FlashBufferPool(100);
        for (let i = 0; i < iterations; i++) {
            const size = sizes[i % sizes.length];
            const buf = pool.acquire(size);
            new Uint8Array(buf)[0] = 1;
            pool.release(buf);
        }
    });

/* Check Global Pool */
import { defaultPool } from '../src/';
defaultPool.clear();
bench.add('Global defaultPool', () => {
    for (let i = 0; i < iterations; i++) {
        const size = sizes[i % sizes.length];
        const buf = defaultPool.acquire(size);
        new Uint8Array(buf)[0] = 1;
        defaultPool.release(buf);
    }
});

/**
 * Run Benchmarks
 */
async function runBench() {
    await bench.run();
    console.table(bench.table());
}
runBench().catch(console.error);