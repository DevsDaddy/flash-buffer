/**
 * Flash Buffer Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 */
import {beforeEach, describe, expect, it} from 'vitest';
import {FlashBuffer, Endianness} from "../src";

/**
 * Describe FlashBuffer tests
 */
describe('FlashBuffer Tests', () => {
    let buf: FlashBuffer;

    beforeEach(() => {
        buf = new FlashBuffer({ initialSize: 64, endianness: Endianness.Little });
    });

    it('Should write and read uint8', () => {
        buf.writeUint8(42).writeUint8(255);
        buf.seek(0);
        expect(buf.readUint8()).toBe(42);
        expect(buf.readUint8()).toBe(255);
    });

    it('Should handle endianness correctly', () => {
        buf.writeUint32(0x12345678, true); // little
        buf.seek(0);
        expect(buf.readUint32(true)).toBe(0x12345678);
        buf.seek(0);
        expect(buf.readUint32(false)).not.toBe(0x12345678); // big-endian view gives different value
    });

    it('Should auto-grow when writing beyond capacity', () => {
        const small = new FlashBuffer({ initialSize: 4 });
        small.writeUint32(0xFFFFFFFF).writeUint8(1); // triggers grow
        expect(small.size).toBeGreaterThanOrEqual(5);
        small.seek(4);
        expect(small.readUint8()).toBe(1);
    });

    it('Should read/write strings with and without prefix', () => {
        const str = 'Hello, 世界!';
        buf.writeString(str, 'utf-8', true);
        buf.seek(0);
        const len = buf.readUint32();
        const readStr = buf.readString(len, 'utf-8');
        expect(readStr).toBe(str);

        buf.seek(0);
        buf.writeString('short', 'utf-8', false);
        buf.seek(0);
        expect(buf.readString(5)).toBe('short');
    });

    it('Should return a zero-copy view with readBytes', () => {
        const data = new Uint8Array([1, 2, 3, 4]);
        buf.writeBytes(data);
        buf.seek(0);
        const view = buf.readBytes(4);
        expect(view).toEqual(data);
        // modify view -> modifies buffer
        view[0] = 99;
        buf.seek(0);
        expect(buf.readUint8()).toBe(99);
    });

    it('Should correctly handle offset movements', () => {
        buf.writeUint32(123).writeUint16(456);
        expect(buf.offset).toBe(6);
        buf.skip(-2);
        expect(buf.readUint16()).toBe(456);
        buf.reset();
        expect(buf.offset).toBe(0);
        expect(buf.readUint32()).toBe(123);
    });

    it('Should work with SharedArrayBuffer when requested', () => {
        if (typeof SharedArrayBuffer !== 'undefined') {
            const shared = new FlashBuffer({ useShared: true, initialSize: 16 });
            expect(shared.buffer).toBeInstanceOf(SharedArrayBuffer);
        }
    });
});