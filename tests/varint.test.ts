/**
 * Flash Buffer VarInt Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
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
});