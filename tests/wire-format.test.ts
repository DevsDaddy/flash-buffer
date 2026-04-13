/**
 * Flash Buffer Protobuf WireFormat Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1003
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
import { describe, it, expect } from 'vitest';
import {FlashBuffer, ProtobufWireType} from "../src";

describe('Protobuf Wire Format', () => {
    function makeTag(fieldNumber: number, wireType: ProtobufWireType): number {
        return (fieldNumber << 3) | wireType;
    }

    it('should write and read a tag', () => {
        const buf = new FlashBuffer();
        const fieldNum = 5;
        const wireType = ProtobufWireType.Varint;
        const tag = makeTag(fieldNum, wireType);

        buf.writeVarUint(tag);
        buf.reset();

        const readTag = buf.readVarUint();
        expect(readTag).toBe(tag);
        expect(readTag >>> 3).toBe(fieldNum);
        expect(readTag & 0x07).toBe(wireType);
    });

    it('should write a complete varint field', () => {
        const buf = new FlashBuffer();
        const fieldNum = 2;
        const value = 150;

        buf.writeVarUint(makeTag(fieldNum, ProtobufWireType.Varint));
        buf.writeVarUint(value);

        buf.reset();
        const tag = buf.readVarUint();
        expect(tag >>> 3).toBe(fieldNum);
        expect(tag & 0x07).toBe(ProtobufWireType.Varint);
        expect(buf.readVarUint()).toBe(value);
    });

    it('should write a length-delimited field (string)', () => {
        const buf = new FlashBuffer();
        const fieldNum = 3;
        const str = 'Hello, protobuf!';
        const encoded = new TextEncoder().encode(str);

        buf.writeVarUint(makeTag(fieldNum, ProtobufWireType.LengthDelimited));
        buf.writeVarUint(encoded.byteLength);
        buf.writeBytes(encoded);

        buf.reset();
        const tag = buf.readVarUint();
        expect(tag & 0x07).toBe(ProtobufWireType.LengthDelimited);
        const length = buf.readVarUint();
        expect(length).toBe(encoded.byteLength);
        expect(buf.readString(length)).toBe(str);
    });

    it('should write a fixed64 field', () => {
        const buf = new FlashBuffer();
        const fieldNum = 4;
        const value = 0x123456789abcdef0n;

        buf.writeVarUint(makeTag(fieldNum, ProtobufWireType.Fixed64));
        buf.writeBigUint64(value, true);

        buf.reset();
        const tag = buf.readVarUint();
        expect(tag & 0x07).toBe(ProtobufWireType.Fixed64);
        expect(buf.readBigUint64(true)).toBe(value);
    });
});