/**
 * Flash Buffer VarInt Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1003
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
import { describe, it, expect } from 'vitest';
import {FlashBuffer} from "../src";

/**
 * Describe VarInt tests
 */
describe('FlashBuffer VarInt tests', () => {
    it('should encode/decode varuint correctly', () => {
        const tests = [0, 1, 127, 128, 16383, 16384, 2097151, 2097152, 268435455, 268435456, 4294967295];
        const buf = new FlashBuffer();
        for (const val of tests) {
            buf.reset();
            buf.writeVarUint(val);
            buf.reset();
            expect(buf.readVarUint()).toBe(val);
        }
    });

    it('should encode/decode varint (zigzag)', () => {
        const tests = [0, -1, 1, -2, 2, 2147483647, -2147483648];
        const buf = new FlashBuffer();
        for (const val of tests) {
            buf.reset();
            buf.writeVarInt(val);
            buf.reset();
            expect(buf.readVarInt()).toBe(val);
        }
    });

    it('should encode/decode sint32 (ZigZag)', () => {
        const buf = new FlashBuffer();
        const tests = [0, -1, 1, -2, 2, 2147483647, -2147483648];
        for (const val of tests) {
            buf.reset();
            buf.writeSint32(val);
            buf.reset();
            expect(buf.readSint32()).toBe(val);
        }
    });

    it('should encode/decode sint64 (ZigZag)', () => {
        const buf = new FlashBuffer();
        const tests: bigint[] = [0n, -1n, 1n, -(1n << 62n), (1n << 62n) - 1n];
        for (const val of tests) {
            buf.reset();
            buf.writeSint64(val);
            buf.reset();
            expect(buf.readSint64()).toBe(val);
        }
    });

    it('should match protobufjs zigzag encoding for sint32', () => {
        const knownPairs = [
            [0, 0],
            [-1, 1],
            [1, 2],
            [-2, 3],
            [2, 4],
            [-2147483648, 4294967295],
            [2147483647, 4294967294],
        ];
        const buf = new FlashBuffer();
        for (const [decoded, zigzag] of knownPairs) {
            buf.reset();
            buf.writeVarUint(zigzag);
            buf.reset();
            expect(buf.readSint32()).toBe(decoded);
        }
    });
});