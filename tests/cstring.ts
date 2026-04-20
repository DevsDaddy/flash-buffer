/**
 * Flash Buffer C-String Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.6
 * @build               1005
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             20.04.2026
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {ConvertUtils, FlashBuffer} from '../src';

describe('FlashBuffer C-String operations tests', () => {
    let buf: FlashBuffer;

    beforeEach(() => {
        buf = new FlashBuffer({ initialSize: 1024 });
    });

    it('should write and read simple C-string', () => {
        const str = 'hello world';
        buf.writeCString(str);
        buf.reset();

        const restored = buf.readCString();
        expect(restored).toBe(str);
        expect(buf.offset).toBe(str.length + 1);
    });

    it('should handle empty string', () => {
        buf.writeCString('');
        buf.reset();

        expect(buf.readCString()).toBe('');
        expect(buf.offset).toBe(1); // only null terminator
    });

    it('should support UTF-8 characters', () => {
        const str = 'Привет, 世界!';
        buf.writeCString(str);
        buf.reset();

        expect(buf.readCString()).toBe(str);
    });

    it('should read C-string from middle of buffer', () => {
        buf.writeUint32(12345);
        buf.writeCString('middle');
        buf.writeFloat64(3.14);

        // seek past uint32
        buf.seek(4);
        expect(buf.readCString()).toBe('middle');
        expect(buf.readFloat64()).toBe(3.14);
    });

    it('should throw on unterminated string', () => {
        const str = 'no terminator';
        // Write without null terminator
        buf.writeBytes(ConvertUtils.textToBytes(str));
        buf.reset();

        expect(() => buf.readCString()).toThrow('Unterminated C string');
    });

    it('should handle multiple C-strings in sequence', () => {
        const strings = ['first', 'second', 'third'];
        for (const s of strings) {
            buf.writeCString(s);
        }
        buf.reset();

        const restored: string[] = [];
        while (buf.remaining > 0) {
            restored.push(buf.readCString());
        }
        expect(restored).toEqual(strings);
    });
});