/**
 * Flash Buffer Primitives Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1003
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { FlashBuffer } from "../src";
import {
    Uint8, Int8,
    Uint16LE, Uint16BE, Int16LE, Int16BE,
    Uint32LE, Uint32BE, Int32LE, Int32BE,
    Float32LE, Float32BE, Float64LE, Float64BE,
    BigUint64LE, BigUint64BE, BigInt64LE, BigInt64BE,
    VarUint32, VarInt32, VarUint64
} from '../src';

describe('FlashBuffer Primitive Types', () => {
    let buf: FlashBuffer;

    beforeEach(() => {
        buf = new FlashBuffer({ initialSize: 64 });
    });

    it('Uint8 should validate range', () => {
        expect(() => Uint8.create(256)).toThrow(RangeError);
        expect(() => Uint8.create(-1)).toThrow(RangeError);
        const val = Uint8.create(42);
        expect(val).toBe(42);
    });

    it('should write and read Uint8', () => {
        const val = Uint8.create(0xAB);
        Uint8.write(buf, val);
        buf.reset();
        const read = Uint8.read(buf);
        expect(read).toBe(0xAB);
    });

    it('should write and read Uint16LE/BE', () => {
        const le = Uint16LE.create(0x1234);
        Uint16LE.write(buf, le);
        const be = Uint16BE.create(0x5678);
        Uint16BE.write(buf, be);
        buf.reset();
        expect(Uint16LE.read(buf)).toBe(0x1234);
        expect(Uint16BE.read(buf)).toBe(0x5678);
    });

    it('should write and read Int32LE/BE', () => {
        const le = Int32LE.create(-123456);
        const be = Int32BE.create(654321);
        Int32LE.write(buf, le);
        Int32BE.write(buf, be);
        buf.reset();
        expect(Int32LE.read(buf)).toBe(-123456);
        expect(Int32BE.read(buf)).toBe(654321);
    });

    it('should write and read Float64LE/BE', () => {
        const le = Float64LE.create(3.1415926535);
        const be = Float64BE.create(-2.71828);
        Float64LE.write(buf, le);
        Float64BE.write(buf, be);
        buf.reset();
        expect(Float64LE.read(buf)).toBeCloseTo(3.1415926535);
        expect(Float64BE.read(buf)).toBeCloseTo(-2.71828);
    });

    it('should write and read BigUint64', () => {
        const val = BigUint64LE.create(0x123456789ABCDEF0n);
        BigUint64LE.write(buf, val);
        buf.reset();
        expect(BigUint64LE.read(buf)).toBe(0x123456789ABCDEF0n);
    });

    it('should write and read VarUint32', () => {
        const val = VarUint32.create(300);
        VarUint32.write(buf, val);
        buf.reset();
        expect(VarUint32.read(buf)).toBe(300);
    });

    it('should write and read VarInt32 (ZigZag)', () => {
        const val = VarInt32.create(-15);
        VarInt32.write(buf, val);
        buf.reset();
        expect(VarInt32.read(buf)).toBe(-15);
    });

    it('should reject invalid BigUint64', () => {
        expect(() => BigUint64LE.create(-1n)).toThrow(RangeError);
        expect(() => BigUint64BE.create(0x10000000000000000n)).toThrow(RangeError);
    });

    it('should write using FlashBuffer', ()=>{
        const newBuf = new FlashBuffer();

        // Create primitives
        const magic = Uint16LE.create(0x4D42);
        const fileSize = Uint32BE.create(102400);
        const version = Uint8.create(1);
        const compression = Float32LE.create(0.75);
        const data = "Hello world";

        newBuf.write(Uint16LE, magic);
        newBuf.write(Uint32BE, fileSize);
        newBuf.write(Uint8, version);
        newBuf.write(Float32LE, compression);
        newBuf.writeString(data, "utf-16");

        // Reset offset and read
        newBuf.reset();
        const readMagic = newBuf.read(Uint16LE);
        const readSize = newBuf.read(Uint32BE);
        const readVer = newBuf.read(Uint8);
        const readComp = newBuf.read(Float32LE);
        const readData = newBuf.readString(data.length, "utf-16");

        expect(readMagic).eq(magic);
        expect(readSize).toBe(fileSize);
        expect(readVer).toBe(version);
        expect(readComp).toBe(compression);
        expect(readData).toBe(data);
    })
});