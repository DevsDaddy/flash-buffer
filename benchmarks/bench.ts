import { Bench } from 'tinybench';
import { FlashBuffer } from '../src';

const bench = new Bench({ time: 1000 });

const iterations = 1_000_000;
const values = Array.from({ length: iterations }, () => Math.floor(Math.random() * 0xFFFFFFFF));

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
    });

async function runBench() {
    await bench.run();
    console.table(bench.table());
}

runBench().catch(console.error);