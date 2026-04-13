/**
 * Flash Buffer Streams Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1003
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
import { describe, it, expect } from 'vitest';
import { FlashWritableStream, FlashReadableStream } from '../src/';

import { ReadableStream, WritableStream } from 'stream/web';
import {FlashBuffer} from "../src"; // Node.js 18+

describe('FlashReadableStream Tests', () => {
    async function createStream(data: Uint8Array): Promise<FlashReadableStream> {
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(data);
                controller.close();
            }
        });
        // @ts-ignore
        return new FlashReadableStream(stream);
    }

    it('should read uint8 values', async () => {
        const data = new Uint8Array([1, 2, 3]);
        const reader = await createStream(data);
        expect(await reader.readUint8()).toBe(1);
        expect(await reader.readUint8()).toBe(2);
        expect(await reader.readUint8()).toBe(3);
        await reader.close();
    });

    it('should read uint32 with endianness', async () => {
        const buf = new FlashBuffer();
        buf.writeUint32(0x12345678, true); // little-endian
        const reader = await createStream(new Uint8Array(buf.buffer));
        expect(await reader.readUint32(true)).toBe(0x12345678);
        await reader.close();
    });

    it('should read across chunk boundaries', async () => {
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new Uint8Array([0x01, 0x02]));
                controller.enqueue(new Uint8Array([0x03, 0x04]));
                controller.close();
            }
        });
        // @ts-ignore
        const reader = new FlashReadableStream(stream);
        expect(await reader.readUint8()).toBe(1);
        expect(await reader.readUint16()).toBe(0x0203);
        expect(await reader.readUint8()).toBe(4);
        await reader.close();
    });

    it('should read string', async () => {
        const str = 'hello stream';
        const encoded = new TextEncoder().encode(str);
        const reader = await createStream(encoded);
        expect(await reader.readString(encoded.byteLength)).toBe(str);
        await reader.close();
    });

    it('should throw on insufficient data', async () => {
        const reader = await createStream(new Uint8Array([1]));
        await expect(reader.readUint32()).rejects.toThrow(RangeError);
        await reader.close();
    });
});

describe('FlashWritableStream Test', () => {
    it('should write and read back through pipe', async () => {
        const chunks: Uint8Array[] = [];
        const writable = new WritableStream<Uint8Array>({
            write(chunk) {
                chunks.push(chunk);
            }
        });

        const writer = new FlashWritableStream(writable);
        writer.writeUint8(42);
        writer.writeUint32(0xDEADBEEF);
        writer.writeString('test');
        await writer.close();

        const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.byteLength;
        }

        const reader = new FlashBuffer(combined.buffer);
        expect(reader.readUint8()).toBe(42);
        expect(reader.readUint32()).toBe(0xDEADBEEF);
        expect(reader.readString(4)).toBe('test');
    });
});