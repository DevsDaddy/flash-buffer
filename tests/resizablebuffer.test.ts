/**
 * Flash Buffer Resizable Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 */
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { ResizableFlashBuffer } from '../src/';

describe('ResizableFlashBuffer Tests', () => {
    beforeAll(() => {
        console.log('Resize supported:', ResizableFlashBuffer.isResizeSupported());
    });

    describe('constructor and properties', () => {
        it('should create resizable buffer when supported', () => {
            const buf = new ResizableFlashBuffer(16, 32);
            expect(buf.size).toBe(16);
            expect(buf.maxByteLength).toBe(32);
            expect(buf.isResizable).toBe(ResizableFlashBuffer.isResizeSupported());
        });

        it('should create non-resizable fallback if resize not supported', () => {
            const buf = new ResizableFlashBuffer(16, 32);
            expect(buf.size).toBe(16);
        });

        it('should accept existing ArrayBuffer', () => {
            const ab = new ArrayBuffer(20);
            const buf = new ResizableFlashBuffer(ab, 50);
            expect(buf.size).toBe(20);
            expect(buf.maxByteLength).toBe(50);
        });
    });

    describe('resize()', () => {
        it('should resize buffer when resizable', () => {
            if (!ResizableFlashBuffer.isResizeSupported()) {
                return;
            }
            const buf = new ResizableFlashBuffer(10, 30);
            buf.writeUint32(0xDEADBEEF);
            expect(buf.size).toBe(10);
            buf.resize(20);
            expect(buf.size).toBe(20);
            // данные сохранились
            buf.seek(0);
            expect(buf.readUint32()).toBe(0xDEADBEEF);
        });

        it('should throw if new size exceeds maxByteLength', () => {
            if (!ResizableFlashBuffer.isResizeSupported()) {
                return;
            }
            const buf = new ResizableFlashBuffer(10, 20);
            expect(() => buf.resize(25)).toThrow(RangeError);
        });

        it('should throw if buffer is not resizable', () => {
            const ab = new ArrayBuffer(10);
            const buf = new ResizableFlashBuffer(ab, 20);
            expect(buf.isResizable).toBe(false);
            expect(() => buf.resize(15)).toThrow(/not resizable/);
        });
    });

    describe('grow behavior', () => {
        it('should use resize when resizable instead of copying', () => {
            if (!ResizableFlashBuffer.isResizeSupported()) {
                return;
            }
            const buf = new ResizableFlashBuffer(4, 16);
            buf.writeUint32(123456);
            buf.writeUint32(789012);
            expect(buf.size).toBeGreaterThanOrEqual(8);
            buf.seek(0);
            expect(buf.readUint32()).toBe(123456);
            expect(buf.readUint32()).toBe(789012);
        });

        it('should fallback to copy when not resizable', () => {
            const buf = new ResizableFlashBuffer(new ArrayBuffer(4), 10);
            expect(buf.isResizable).toBe(false);
            buf.writeUint32(0x12345678);
            buf.writeUint8(0xAA); // trigger grow
            expect(buf.size).toBeGreaterThan(4);
            buf.seek(0);
            expect(buf.readUint32()).toBe(0x12345678);
            expect(buf.readUint8()).toBe(0xAA);
        });
    });

    describe('increaseMaxByteLength', () => {
        it('should increase maxByteLength and preserve data', () => {
            const buf = new ResizableFlashBuffer(8, 10);
            buf.writeUint32(111);
            buf.writeUint32(222);
            buf.increaseMaxByteLength(20);
            expect(buf.maxByteLength).toBe(20);
            buf.seek(0);
            expect(buf.readUint32()).toBe(111);
            expect(buf.readUint32()).toBe(222);
        });
    });
});