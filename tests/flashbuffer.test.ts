/**
 * Flash Buffer Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1005
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             20.04.2026
 */
import {beforeEach, describe, expect, it} from 'vitest';
import {FlashBuffer, Endianness} from "../src";

interface TypedTestOptions {
    first: number;
    second: string;
    third: boolean;
}

interface TypedTest {
    id: number;
    name: string;
    options: TypedTestOptions;
}

/**
 * Describe FlashBuffer tests
 */
describe('FlashBuffer Tests', () => {
    let buf: FlashBuffer;

    beforeEach(() => {
        buf = new FlashBuffer({ initialSize: 64, endianness: Endianness.Little });
    });

    it('should write and read simple bit patterns', () => {
        const bits = buf.bit();

        bits.writeBits(0b101, 3);
        bits.writeBits(0b11, 2);
        bits.flush();

        buf.reset();
        const readBits = buf.bit();
        expect(readBits.readBits(3)).toBe(0b101);
        expect(readBits.readBits(2)).toBe(0b11);
    });

    it('should preserve all bits across boundaries (detailed)', () => {
        const buf = new FlashBuffer({ initialSize: 4 });
        const bits = buf.bit();

        // Пишем 5 бит единиц (11111) = 31
        bits.writeBits(0b11111, 5);
        // Пишем 5 бит (10101) = 21
        bits.writeBits(0b10101, 5);
        bits.flush();

        buf.reset();
        const readBits = buf.bit();
        expect(readBits.readBits(5)).toBe(0b11111);
        expect(readBits.readBits(5)).toBe(0b10101);
    });

    it('should handle up to 32 bits', () => {
        const bits = buf.bit();
        const value = 0x12345678;
        bits.writeBits(value, 32);
        bits.flush();

        buf.reset();
        const readBits = buf.bit();
        expect(readBits.readBits(32)).toBe(value);
    });

    it('should work mixed with byte-aligned operations', () => {
        buf.writeUint8(0xAA);
        const bits = buf.bit();
        bits.writeBits(0b110, 3);
        bits.flush();
        buf.writeUint8(0x55);

        buf.reset();
        expect(buf.readUint8()).toBe(0xAA);

        const readBits = buf.bit();
        expect(readBits.readBits(3)).toBe(0b110);
        readBits.flush();

        expect(buf.readUint8()).toBe(0x55);
    });

    it('should flush correctly', () => {
        const bits = buf.bit();
        bits.writeBits(1, 1);
        bits.flush(); // should advance offset to next byte

        const before = buf.offset;
        bits.writeBits(2, 2);
        bits.flush();
        expect(buf.offset).toBe(before + 1);
    });

    it('should throw on invalid bit counts', () => {
        const bits = buf.bit();
        expect(() => bits.writeBits(1, 0)).toThrow();
        expect(() => bits.writeBits(1, 33)).toThrow();
        expect(() => bits.readBits(0)).toThrow();
        expect(() => bits.readBits(33)).toThrow();
    });

    it('should handle large bit sequences', () => {
        const bits = buf.bit();
        for (let i = 0; i < 100; i++) {
            bits.writeBits(i & 0x7F, 7);
        }
        bits.flush();

        buf.reset();
        const readBits = buf.bit();
        for (let i = 0; i < 100; i++) {
            expect(readBits.readBits(7)).toBe(i & 0x7F);
        }
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

    it('Should write and read boolean', ()=>{
        buf.writeBool(true);
        buf.writeBool(false);
        buf.reset();

        let first = buf.readBool();
        let second = buf.readBool();
        expect(first).toEqual(true);
        expect(second).toEqual(false);
    });
});