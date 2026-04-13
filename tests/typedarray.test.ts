/**
 * Flash Buffer TypedArray Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1004
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {FlashBuffer} from "../src";

/**
 * Describe TypedArray Tests
 */
describe('FlashBuffer TypedArray operations tests', () => {
    let buf: FlashBuffer;

    beforeEach(() => {
        buf = new FlashBuffer({ initialSize: 1024 });
    });

    it('should write and read Uint8Array', () => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        buf.writeTypedArray(data);
        buf.reset();

        const restored = buf.readTypedArray(Uint8Array, data.length);
        expect(restored).toEqual(data);
    });

    it('should write and read Float32Array', () => {
        const data = new Float32Array([1.5, -3.14, 42.0, 0.001]);
        buf.writeTypedArray(data);
        buf.reset();

        const restored = buf.readTypedArray(Float32Array, data.length);
        expect(restored).toEqual(data);
    });

    it('should handle offset correctly after typed array write', () => {
        buf.writeUint8(0xAB);
        const posBefore = buf.offset;

        const data = new Int16Array([-100, 200, -300]);
        buf.writeTypedArray(data);

        expect(buf.offset).toBe(posBefore + data.byteLength);
    });

    it('should read typed array from specific position', () => {
        buf.writeUint32(0xDEADBEEF);
        buf.writeTypedArray(new Uint16Array([0x1234, 0x5678]));

        // Seek to position after uint32
        buf.seek(4);
        const restored = buf.readTypedArray(Uint16Array, 2);
        expect(restored).toEqual(new Uint16Array([0x1234, 0x5678]));
    });

    it('should throw if reading beyond buffer', () => {
        const small = new FlashBuffer({ initialSize: 4 });
        small.writeUint32(123);
        small.reset();
        expect(() => small.readTypedArray(Float64Array, 1)).toThrow();
    });
});