/**
 * Flash Buffer Protobuf Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1002
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {FlashBuffer} from "../src";
import {ProtobufReader, ProtobufWriter} from "../src";

describe('ProtobufReader/Writer', () => {
    let buf: FlashBuffer;
    let writer: ProtobufWriter;

    beforeEach(() => {
        buf = new FlashBuffer();
        writer = new ProtobufWriter(buf);
    });

    it('should write and read int32 field', () => {
        writer.writeInt32(1, 42);
        writer.writeInt32(2, -100);
        const reader = new ProtobufReader(buf.reset());

        let found1 = false, found2 = false;
        while (reader.hasMore()) {
            const tag = reader.readTag();
            switch (tag.fieldNumber) {
                case 1:
                    expect(reader.readInt32()).toBe(42);
                    found1 = true;
                    break;
                case 2:
                    expect(reader.readInt32()).toBe(-100);
                    found2 = true;
                    break;
                default: reader.skipField(tag.wireType);
            }
        }
        expect(found1 && found2).toBe(true);
    });

    it('should write and read string field', () => {
        writer.writeString(3, 'тест');
        const reader = new ProtobufReader(buf.reset());

        const tag = reader.readTag();
        expect(tag.fieldNumber).toBe(3);
        expect(reader.readString()).toBe('тест');
    });

    it('should skip unknown fields', () => {
        writer.writeInt32(1, 123);
        writer.writeString(2, 'skip me');
        writer.writeFixed32(3, 0xDEADBEEF);
        const reader = new ProtobufReader(buf.reset());

        while (reader.hasMore()) {
            const tag = reader.readTag();
            if (tag.fieldNumber === 1) {
                expect(reader.readInt32()).toBe(123);
            } else {
                reader.skipField(tag.wireType);
            }
        }
    });
});