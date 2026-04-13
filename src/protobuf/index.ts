/**
 * Flash Buffer Protobuf support
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1003
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
/* Import required modules */
import { FlashBuffer } from "../core/buffer";
import {ProtobufWireType, protobufEncodeTag, protobufDecodeTag, ProtobufTag} from './types';

/* Export Protobuf Types */
export * from "./types";

/**
 * Protobuf Writer
 */
export class ProtobufWriter {
    /**
     * Create protobuf writer
     * @param buffer
     */
    constructor(public buffer: FlashBuffer) {}

    // Write operations
    /**
     * Write Int32
     * @param fieldNumber
     * @param value
     */
    public writeInt32(fieldNumber: number, value: number): void {
        this.writeTag(fieldNumber, ProtobufWireType.Varint);
        this.buffer.writeVarUint(value >>> 0);
    }

    /**
     * Write Int64
     * @param fieldNumber
     * @param value
     */
    public writeInt64(fieldNumber: number, value: bigint): void {
        this.writeTag(fieldNumber, ProtobufWireType.Varint);
        this.buffer.writeVarUint64(value);
    }

    /**
     * Write Uint32
     * @param fieldNumber
     * @param value
     */
    public writeUint32(fieldNumber: number, value: number): void {
        this.writeTag(fieldNumber, ProtobufWireType.Varint);
        this.buffer.writeVarUint(value >>> 0);
    }

    /**
     * Write Uint64
     * @param fieldNumber
     * @param value
     */
    public writeUint64(fieldNumber: number, value: bigint): void {
        this.writeTag(fieldNumber, ProtobufWireType.Varint);
        this.buffer.writeVarUint64(value);
    }

    /**
     * Write Sint32
     * @param fieldNumber
     * @param value
     */
    public writeSint32(fieldNumber: number, value: number): void {
        this.writeTag(fieldNumber, ProtobufWireType.Varint);
        this.buffer.writeSint32(value);
    }

    /**
     * Write Sint64
     * @param fieldNumber
     * @param value
     */
    public writeSint64(fieldNumber: number, value: bigint): void {
        this.writeTag(fieldNumber, ProtobufWireType.Varint);
        this.buffer.writeSint64(value);
    }

    /**
     * Write Boolean
     * @param fieldNumber
     * @param value
     */
    public writeBool(fieldNumber: number, value: boolean): void {
        this.writeTag(fieldNumber, ProtobufWireType.Varint);
        this.buffer.writeUint8(value ? 1 : 0);
    }

    /**
     * Write ENUM
     * @param fieldNumber
     * @param value
     */
    public writeEnum(fieldNumber: number, value: number): void {
        this.writeInt32(fieldNumber, value);
    }

    /**
     * Write Fixed32
     * @param fieldNumber
     * @param value
     */
    public writeFixed32(fieldNumber: number, value: number): void {
        this.writeTag(fieldNumber, ProtobufWireType.Fixed32);
        this.buffer.writeFixed32(value);
    }

    /**
     * Write Fixed64
     * @param fieldNumber
     * @param value
     */
    public writeFixed64(fieldNumber: number, value: bigint): void {
        this.writeTag(fieldNumber, ProtobufWireType.Fixed64);
        this.buffer.writeFixed64(value);
    }

    /**
     * Write SFixed32
     * @param fieldNumber
     * @param value
     */
    public writeSFixed32(fieldNumber: number, value: number): void {
        this.writeTag(fieldNumber, ProtobufWireType.Fixed32);
        this.buffer.writeSFixed32(value);
    }

    /**
     * Write SFixed64
     * @param fieldNumber
     * @param value
     */
    public writeSFixed64(fieldNumber: number, value: bigint): void {
        this.writeTag(fieldNumber, ProtobufWireType.Fixed64);
        this.buffer.writeSFixed64(value);
    }

    /**
     * Write Float
     * @param fieldNumber
     * @param value
     */
    public writeFloat(fieldNumber: number, value: number): void {
        this.writeTag(fieldNumber, ProtobufWireType.Fixed32);
        this.buffer.writeFloat32(value, true);
    }

    /**
     * Write Double
     * @param fieldNumber
     * @param value
     */
    public writeDouble(fieldNumber: number, value: number): void {
        this.writeTag(fieldNumber, ProtobufWireType.Fixed64);
        this.buffer.writeFloat64(value, true);
    }

    /**
     * Write String
     * @param fieldNumber
     * @param value
     */
    public writeString(fieldNumber: number, value: string): void {
        const encoded = new TextEncoder().encode(value);
        this.writeBytes(fieldNumber, encoded);
    }

    /**
     * Write bytes
     * @param fieldNumber
     * @param value
     */
    public writeBytes(fieldNumber: number, value: Uint8Array): void {
        this.writeTag(fieldNumber, ProtobufWireType.LengthDelimited);
        this.buffer.writeVarUint(value.byteLength);
        this.buffer.writeBytes(value);
    }

    /**
     * Write Message
     * @param fieldNumber
     * @param messageWriter
     */
    public writeMessage(fieldNumber: number, messageWriter: (writer: ProtobufWriter) => void): void {
        const nestedBuf = new FlashBuffer();
        const nestedWriter = new ProtobufWriter(nestedBuf);
        messageWriter(nestedWriter);
        const nestedBytes = new Uint8Array(nestedBuf.buffer as ArrayBuffer);
        this.writeBytes(fieldNumber, nestedBytes);
    }

    /**
     * Get current puffer
     */
    public getBuffer(): FlashBuffer {
        return this.buffer;
    }

    private writeTag(fieldNumber: number, wireType: ProtobufWireType): void {
        this.buffer.writeVarUint(protobufEncodeTag(fieldNumber, wireType));
    }
}

/**
 * Protobuf Reader
 */
export class ProtobufReader {
    /**
     * Create protobuf reader
     * @param buffer
     */
    constructor(public buffer: FlashBuffer) {}

    /**
     * Check buffer remaining
     */
    public hasMore(): boolean {
        return this.buffer.remaining > 0;
    }

    /**
     * Read Protobuf Tag
     */
    public readTag(): ProtobufTag {
        return protobufDecodeTag(this.buffer.readVarUint());
    }

    /**
     * Skip field
     * @param wireType
     */
    public skipField(wireType: ProtobufWireType): void {
        switch (wireType) {
            case ProtobufWireType.Varint:
                this.buffer.readVarUint();
                break;
            case ProtobufWireType.Fixed64:
                this.buffer.skip(8);
                break;
            case ProtobufWireType.LengthDelimited:
                const length = this.buffer.readVarUint();
                this.buffer.skip(length);
                break;
            case ProtobufWireType.Fixed32:
                this.buffer.skip(4);
                break;
            default:
                throw new Error(`Unsupported wire type: ${wireType}`);
        }
    }

    // Read Operations
    /**
     * Read Int32
     */
    public readInt32(): number {
        return this.buffer.readVarUint() | 0;
    }

    /**
     * Read Int64
     */
    public readInt64(): bigint {
        return this.buffer.readVarUint64();
    }

    /**
     * Read Uint32
     */
    public readUint32(): number {
        return this.buffer.readVarUint() >>> 0;
    }

    /**
     * Read Uint64
     */
    public readUint64(): bigint {
        return this.buffer.readVarUint64();
    }

    /**
     * Read Sint32
     */
    public readSint32(): number {
        return this.buffer.readSint32();
    }

    /**
     * Read Sint64
     */
    public readSint64(): bigint {
        return this.buffer.readSint64();
    }

    /**
     * Read boolean
     */
    public readBool(): boolean {
        return this.buffer.readUint8() !== 0;
    }

    /**
     * Read ENUM
     */
    public readEnum(): number {
        return this.readInt32();
    }

    /**
     * Read Fixed32
     */
    public readFixed32(): number {
        return this.buffer.readFixed32();
    }

    /**
     * Read Fixed64
     */
    public readFixed64(): bigint {
        return this.buffer.readFixed64();
    }

    /**
     * Read SFixed32
     */
    public readSFixed32(): number {
        return this.buffer.readSFixed32();
    }

    /**
     * Read SFixed64
     */
    public readSFixed64(): bigint {
        return this.buffer.readSFixed64();
    }

    /**
     * Read Float
     */
    public readFloat(): number {
        return this.buffer.readFloat32(true);
    }

    /**
     * Read double
     */
    public readDouble(): number {
        return this.buffer.readFloat64(true);
    }

    /**
     * Read string
     */
    public readString(): string {
        const length = this.buffer.readVarUint();
        return this.buffer.readString(length);
    }

    /**
     * Read bytes
     */
    public readBytes(): Uint8Array {
        const length = this.buffer.readVarUint();
        return this.buffer.readBytes(length);
    }

    /**
     * Read message
     * @param deserializer
     */
    public readMessage<T>(deserializer: (reader: ProtobufReader) => T): T {
        const length = this.buffer.readVarUint();
        const nestedBuf = new FlashBuffer(this.buffer.readBytes(length).buffer);
        const nestedReader = new ProtobufReader(nestedBuf);
        return deserializer(nestedReader);
    }
}