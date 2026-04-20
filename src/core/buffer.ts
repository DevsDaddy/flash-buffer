/**
 * Flash Buffer implementation
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.5
 * @build               1017
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             20.04.2026
 */
/* Import required modules */
import {Endianness, Freezable, GrowthStrategy, ReadonlyFlashBuffer} from './types';
import {applyGrowthStrategy} from "../utils/growthStrategies";
import {FlashBitBuffer} from "./bitbuffer";
import {FlashBufferPool} from "./pool";
import {applyPatch, createPatch} from "../diff";
import { SHARED_ARRAY_BUFFER_AVAILABLE } from "../constants";
import {readValueDynamic, writeValueDynamic} from "../schema/value-serializer";

/* Pre-created text encoder and decoder */
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Flash Buffer Options
 */
export interface FlashBufferOptions {
    /** Initial buffer size in bytes. Ignored if `buffer` is provided. */
    initialSize?: number;
    /** Default endianness for read/write operations (can be overridden per call). */
    endianness?: Endianness;
    /** Growth strategy when buffer needs to expand. */
    growthStrategy?: GrowthStrategy;
    /** Whether to use SharedArrayBuffer when creating a new buffer. */
    useShared?: boolean;
    /* Buffer pooling */
    pool?: FlashBufferPool;
    /** Autor release buffer after dispose */
    autoRelease?: boolean;
}

/**
 * Flash buffer implementation
 */
export class FlashBuffer implements Freezable{
    /* Buffer Parameters */
    protected _buffer: ArrayBuffer | SharedArrayBuffer;
    protected _dataView: DataView;
    protected _offset: number = 0;
    protected _endianness: Endianness;
    protected _growthStrategy: Exclude<FlashBufferOptions['growthStrategy'], undefined>;
    protected _frozen: boolean = false;

    /* Buffer Pools */
    protected _pool?: FlashBufferPool;
    private readonly _autoRelease: boolean;

    /**
     * Create FlashBuffer with Options
     * @param options {FlashBufferOptions} Buffer options
     */
    constructor(options?: FlashBufferOptions);

    /**
     * Create FlashBuffer using ArrayBuffer or SharedArrayBuffer
     * @param buffer {ArrayBuffer|SharedArrayBuffer} Buffer instance
     * @param options {FlashBufferOptions} Buffer options
     */
    constructor(buffer: ArrayBuffer | SharedArrayBuffer, options?: Omit<FlashBufferOptions, 'initialSize' | 'useShared'>);

    /**
     * Create FlashBuffer
     * @param bufferOrOptions {ArrayBuffer|SharedArrayBuffer|FlashBufferOptions} ArrayBuffer / SharedArrayBuffer or Buffer Options
     * @param options buffer options
     */
    constructor(
        bufferOrOptions?: ArrayBuffer | SharedArrayBuffer | FlashBufferOptions,
        options?: Omit<FlashBufferOptions, 'initialSize' | 'useShared'>
    ) {
        let buffer: ArrayBuffer | SharedArrayBuffer;
        let opts: FlashBufferOptions = {};

        const isArrayBuffer = bufferOrOptions instanceof ArrayBuffer;
        const isSharedArrayBuffer = SHARED_ARRAY_BUFFER_AVAILABLE && bufferOrOptions instanceof SharedArrayBuffer;

        if (isArrayBuffer || isSharedArrayBuffer) {
            buffer = bufferOrOptions;
            opts = options ?? {};
        } else {
            opts = bufferOrOptions as FlashBufferOptions ?? {};
            const size = opts.initialSize ?? 1024;
            const useShared = opts.useShared ?? (typeof SharedArrayBuffer !== 'undefined');
            buffer = useShared ? SHARED_ARRAY_BUFFER_AVAILABLE ? new SharedArrayBuffer(size) : new ArrayBuffer(size) : new ArrayBuffer(size);
        }

        this._buffer = buffer;
        this._dataView = new DataView(buffer as ArrayBuffer);
        this._endianness = opts.endianness ?? Endianness.Big;
        this._growthStrategy = opts.growthStrategy ?? 'powerOfTwo';
        this._pool = opts.pool;
        this._autoRelease = opts.autoRelease ?? true;

        if (!buffer && this._pool) {
            const size = opts.initialSize ?? 1024;
            this._buffer = this._pool.acquire(size);
        }
    }

    // #region Freezable
    /**
     * Freeze FlashBuffer
     * @returns {ReadonlyFlashBuffer} Return as ReadonlyFlashBuffer
     */
    public freeze(): ReadonlyFlashBuffer {
        this._frozen = true;
        return this as any;
    }

    /**
     * Checks if FlashBuffer is frozen
     * @returns {boolean}
     */
    public isFrozen(): boolean {
        return this._frozen;
    }

    /**
     * Ensure writable
     * @protected
     */
    protected ensureWritable(): void {
        if (this._frozen) {
            throw new Error('Buffer is frozen and cannot be written to');
        }
    }
    // #endregion

    /**
     * Returns the underlying buffer (may be SharedArrayBuffer)
     * @returns {ArrayBuffer|SharedArrayBuffer} Buffer
     */
    get buffer(): ArrayBuffer | SharedArrayBuffer {
        return this._buffer;
    }

    /**
     * Current read/write position.
     * @returns {number} Offset
     */
    public get offset(): number {
        return this._offset;
    }

    /**
     * Total size of the buffer in bytes.
     * @returns {number} buffer length
     */
    public get size(): number {
        return this._buffer.byteLength;
    }

    /**
     * Number of bytes remaining from current offset to the end.
     * @returns {number} remaining bytes to end of buffer
     */
    public get remaining(): number {
        return this.size - this._offset;
    }

    /**
     * Sets the current offset to an absolute position.
     * @param offset {number} offset
     * @returns {FlashBuffer} current buffer instance
     */
    public seek(offset: number): this {
        if (offset < 0 || offset > this.size) {
            throw new RangeError(`Offset ${offset} out of bounds [0, ${this.size}]`);
        }
        this._offset = offset;
        return this;
    }

    /**
     * Moves the offset forward by `bytes`.
     * @param bytes {number} skip bytes
     * @returns {FlashBuffer} current buffer instance
     */
    public skip(bytes: number): this {
        return this.seek(this._offset + bytes);
    }

    /**
     * Resets the offset to 0.
     * @returns {FlashBuffer} current buffer instance
     */
    public reset(): this {
        this._offset = 0;
        return this;
    }

    // #region Growth buffer
    /**
     * Ensure writable space
     * @param bytes {number} Bytes to ensure
     * @protected
     */
    public ensureWritableSpace(bytes: number): void {
        this.ensureWritable();
        const required = this._offset + bytes;
        if (required > this.size) {
            this.grow(required);
        }
    }

    /**
     * Grow buffer
     * @param minSize {number} Minimal size
     * @protected
     */
    protected grow(minSize: number): void {
        const newSize = applyGrowthStrategy(this.size, minSize, this._growthStrategy);
        const newBuffer = SHARED_ARRAY_BUFFER_AVAILABLE && this._buffer instanceof SharedArrayBuffer
            ? new SharedArrayBuffer(newSize)
            : new ArrayBuffer(newSize);

        new Uint8Array(newBuffer).set(new Uint8Array(this._buffer as ArrayBuffer));
        this._buffer = newBuffer;
        this._dataView = new DataView(newBuffer as ArrayBuffer);
    }
    // #endregion

    // #region Reading
    /**
     * Ensure readable
     * @param bytes {number} Bytes
     * @protected
     */
    public ensureReadable(bytes: number): void {
        if (this._offset + bytes > this.size) {
            throw new RangeError(`Not enough data to read ${bytes} bytes at offset ${this._offset}`);
        }
    }

    /**
     * Read primitive value from buffer
     * @param readFn {Function} Read function
     * @param byteLength {number} Byte length
     * @param littleEndian {boolean} is little endian
     * @returns {any} Primitive value
     * @protected
     */
    protected readPrimitive<T>(readFn: (dv: DataView, offset: number, littleEndian?: boolean) => T, byteLength: number, littleEndian?: boolean): T {
        this.ensureReadable(byteLength);
        const value = readFn(this._dataView, this._offset, littleEndian);
        this._offset += byteLength;
        return value;
    }

    /**
     * Read boolean value
     * @returns {boolean} Bool value
     */
    public readBool() : boolean { return (this.readPrimitive((dv, off) => dv.getUint8(off), 1) !== 0); }

    /**
     * Read Int8
     * @returns {number} Int8 value
     */
    public readInt8(): number { return this.readPrimitive((dv, off) => dv.getInt8(off), 1); }

    /**
     * Read Uint8 value
     * @returns {number} Uint8 value
     */
    public readUint8(): number { return this.readPrimitive((dv, off) => dv.getUint8(off), 1); }

    /**
     * Read Int16 value
     * @param le {boolean} is little endian
     * @returns {number} Int16 value
     */
    public readInt16(le?: boolean): number { return this.readPrimitive((dv, off, le) => dv.getInt16(off, le), 2, le ?? this._endianness === Endianness.Little); }

    /**
     * Read Uint16 value
     * @param le {boolean} is little endian
     * @returns {number} Uint16 value
     */
    public readUint16(le?: boolean): number { return this.readPrimitive((dv, off, le) => dv.getUint16(off, le), 2, le ?? this._endianness === Endianness.Little); }

    /**
     * Read Int32 value
     * @param le {boolean} is little endian
     * @returns {number} Int32 value
     */
    public readInt32(le?: boolean): number { return this.readPrimitive((dv, off, le) => dv.getInt32(off, le), 4, le ?? this._endianness === Endianness.Little); }

    /**
     * Read Uint32 value
     * @param le {boolean} is little endian
     * @returns {number} Uint32 value
     */
    public readUint32(le?: boolean): number { return this.readPrimitive((dv, off, le) => dv.getUint32(off, le), 4, le ?? this._endianness === Endianness.Little); }

    /**
     * Read Int64 value
     * @param le {boolean} is little endian
     * @returns {bigint} Int64 value
     */
    public readBigInt64(le?: boolean): bigint { return this.readPrimitive((dv, off, le) => dv.getBigInt64(off, le), 8, le ?? this._endianness === Endianness.Little); }

    /**
     * Read Uint64 value
     * @param le {boolean} is little endian
     * @returns {bigint} Uint64 value
     */
    public readBigUint64(le?: boolean): bigint { return this.readPrimitive((dv, off, le) => dv.getBigUint64(off, le), 8, le ?? this._endianness === Endianness.Little); }

    /**
     * Read Float32 value
     * @param le {boolean} is little endian
     * @returns {number} Float32 value
     */
    public readFloat32(le?: boolean): number { return this.readPrimitive((dv, off, le) => dv.getFloat32(off, le), 4, le ?? this._endianness === Endianness.Little); }

    /**
     * Read Float64 value
     * @param le {boolean} is little endian
     * @returns {number} Float64 value
     */
    public readFloat64(le?: boolean): number { return this.readPrimitive((dv, off, le) => dv.getFloat64(off, le), 8, le ?? this._endianness === Endianness.Little); }

    /**
     * Reads a string of given byte length.
     * Uses TextDecoder; no extra copy is made (decoder works on the buffer view).
     * @param byteLength {number} buffer length
     * @param encoding {string} Text encoding
     * @returns {string} Raw string
     */
    public readString(byteLength ? : number, encoding: string = 'utf-8'): string {
        // Check byte length is defined
        if(!byteLength) byteLength = this.readUint32();

        // Read string
        this.ensureReadable(byteLength);
        const view = new Uint8Array(this._buffer as ArrayBuffer, this._offset, byteLength);
        const str = textDecoder.decode(view);
        this._offset += byteLength;
        return str;
    }

    /**
     * Reads a slice of bytes as a new Uint8Array view (zero-copy).
     * Modifications to the returned array affect the underlying buffer.
     * @param length {number} Buffer length
     * @returns {Uint8Array} Raw buffer
     */
    public readBytes(length: number): Uint8Array {
        this.ensureReadable(length);
        const view = new Uint8Array(this._buffer as ArrayBuffer, this._offset, length);
        this._offset += length;
        return view;
    }

    /**
     * Read Typed value
     * @param factory Typed value
     */
    public read<T>(factory: { read(buf: FlashBuffer): T }): T {
        return factory.read(this);
    }

    /**
     * Read value of type
     */
    public readDynamic<T = any>(): T {
        return readValueDynamic(this) as T;
    }
    // #endregion

    // #region Writing
    /**
     * Write primitive value to buffer
     * @param writeFn {Function} Write function
     * @param value {any} Primitive value
     * @param byteLength {number} byte length
     * @param littleEndian {boolean} is little endian
     * @returns {FlashBuffer} Returns buffer
     * @protected
     */
    protected writePrimitive<T>(writeFn: (dv: DataView, offset: number, value: T, littleEndian?: boolean) => void, value: T, byteLength: number, littleEndian?: boolean): this {
        this.ensureWritableSpace(byteLength);
        writeFn(this._dataView, this._offset, value, littleEndian);
        this._offset += byteLength;
        return this;
    }

    /**
     * Write boolean value
     * @param value {boolean} Bool value
     * @returns {FlashBuffer} current buffer instance
     */
    public writeBool(value : boolean) : this { return this.writePrimitive((dv, off, v) => dv.setInt8(off, v), (value) ? 1 : 0, 1); }

    /**
     * Write Int8 value
     * @param value {number} Int8 value
     * @returns {FlashBuffer} current buffer instance
     */
    public writeInt8(value: number): this { return this.writePrimitive((dv, off, v) => dv.setInt8(off, v), value, 1); }

    /**
     * Write Uint8 value
     * @param value {number} Uint8 value
     * @returns {FlashBuffer} current buffer instance
     */
    public writeUint8(value: number): this { return this.writePrimitive((dv, off, v) => dv.setUint8(off, v), value, 1); }

    /**
     * Write Int16 value
     * @param value {number} Int16 value
     * @param le {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeInt16(value: number, le?: boolean): this { return this.writePrimitive((dv, off, v, le) => dv.setInt16(off, v, le), value, 2, le ?? this._endianness === Endianness.Little); }

    /**
     * Write Uint16 value
     * @param value {number} Uint16 value
     * @param le {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeUint16(value: number, le?: boolean): this { return this.writePrimitive((dv, off, v, le) => dv.setUint16(off, v, le), value, 2, le ?? this._endianness === Endianness.Little); }

    /**
     * Write Int32 value
     * @param value {number} Int32 value
     * @param le {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeInt32(value: number, le?: boolean): this { return this.writePrimitive((dv, off, v, le) => dv.setInt32(off, v, le), value, 4, le ?? this._endianness === Endianness.Little); }

    /**
     * Write Uint32 value
     * @param value {number} Uint32 value
     * @param le {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeUint32(value: number, le?: boolean): this { return this.writePrimitive((dv, off, v, le) => dv.setUint32(off, v, le), value, 4, le ?? this._endianness === Endianness.Little); }

    /**
     * Write BigInt64 value
     * @param value {bigint} BigInt64 value
     * @param le {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeBigInt64(value: bigint, le?: boolean): this { return this.writePrimitive((dv, off, v, le) => dv.setBigInt64(off, v, le), value, 8, le ?? this._endianness === Endianness.Little); }

    /**
     * Write BigUInt64 value
     * @param value {bigint} BigUInt64 value
     * @param le {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeBigUint64(value: bigint, le?: boolean): this { return this.writePrimitive((dv, off, v, le) => dv.setBigUint64(off, v, le), value, 8, le ?? this._endianness === Endianness.Little); }

    /**
     * Write Float32 value
     * @param value {number} Float32 value
     * @param le {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeFloat32(value: number, le?: boolean): this { return this.writePrimitive((dv, off, v, le) => dv.setFloat32(off, v, le), value, 4, le ?? this._endianness === Endianness.Little); }

    /**
     * Write Float64 value
     * @param value {number} Float64 Value
     * @param le {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeFloat64(value: number, le?: boolean): this { return this.writePrimitive((dv, off, v, le) => dv.setFloat64(off, v, le), value, 8, le ?? this._endianness === Endianness.Little); }

    /**
     * Writes a string with given encoding.
     * Optionally prefixes the byte length as uint32 (default false).
     * @param str
     * @param encoding
     * @param prefixLength
     * @returns {FlashBuffer} current buffer instance
     */
    public writeString(str: string, encoding: string = 'utf-8', prefixLength: boolean = false): this {
        const encoded = textEncoder.encode(str);
        if (prefixLength) {
            this.writeUint32(encoded.byteLength);
        }
        this.writeBytes(encoded);
        return this;
    }

    /**
     * Writes raw bytes from a Uint8Array (or any array-like).
     * Zero-copy: the data is copied into the buffer, but no intermediate buffers are created.
     * @param bytes {Uint8Array|Array<number>} Buffer to write
     * @returns {FlashBuffer} current buffer instance
     */
    public writeBytes(bytes: Uint8Array | Array<number>): this {
        const length = bytes.length;
        this.ensureWritableSpace(length);
        new Uint8Array(this._buffer as ArrayBuffer, this._offset, length).set(bytes);
        this._offset += length;
        return this;
    }

    /**
     * Write typed value
     * @param factory {TypeFactory} Typed Value
     * @return value Value
     */
    public write<T>(factory: { write(buf: FlashBuffer, value: T): void }, value: T): this {
        factory.write(this, value);
        return this;
    }

    /**
     * Write value of ant type
     * @param value {any}
     */
    public writeDynamic(value: any): this {
        writeValueDynamic(this, value);
        return this;
    }
    // #endregion

    // #region VarInt support
    /**
     * Read VarUint
     * @returns {number} VarUint value
     */
    public readVarUint(): number {
        let result = 0;
        let shift = 0;
        while (true) {
            if (this._offset >= this.size) throw new RangeError('Incomplete VarUint');
            const byte = this._dataView.getUint8(this._offset++);
            result |= (byte & 0x7f) << shift;
            if ((byte & 0x80) === 0) break;
            shift += 7;
            if (shift >= 35) throw new Error('VarUint too long');
        }
        return result >>> 0; // ensure unsigned
    }

    /**
     * Read VarUint64 Value
     * @returns {bigint} VarUint64 Value
     */
    public readVarUint64(): bigint {
        let result = 0n;
        let shift = 0n;
        while (true) {
            const byte = this._dataView.getUint8(this._offset++);
            result |= BigInt(byte & 0x7f) << shift;
            if ((byte & 0x80) === 0) break;
            shift += 7n;
        }
        return result;
    }

    /**
     * Read VarInt
     * @returns {number} VarInt value
     */
    public readVarInt(): number {
        const raw = this.readVarUint();
        // zigzag decode
        return (raw >>> 1) ^ -(raw & 1);
    }

    /**
     * Read Sint32
     * @returns {number} Sint32 Value
     */
    public readSint32(): number {
        const zigzag = this.readVarUint();
        return (zigzag >>> 1) ^ -(zigzag & 1);
    }

    /**
     * Read Sint64 Value
     */
    public readSint64(): bigint {
        const zigzag = this.readVarUint64();
        // zigzag decode: (zigzag >>> 1) ^ -(zigzag & 1)
        return (zigzag >> 1n) ^ -(zigzag & 1n);
    }

    /**
     * Write VarUint
     * @param value {number} VarUint value
     * @returns {FlashBuffer} Current buffer instance
     */
    public writeVarUint(value: number): this {
        this.ensureWritable();
        let v = value >>> 0;
        do {
            let byte = v & 0x7f;
            v >>>= 7;
            if (v !== 0) byte |= 0x80;
            this.ensureWritableSpace(1);
            this._dataView.setUint8(this._offset++, byte);
        } while (v !== 0);
        return this;
    }

    /**
     * Write VarUint64
     * @param value {bigint} Uint64
     */
    public writeVarUint64(value: bigint): this {
        this.ensureWritable();
        let v = value;
        do {
            let byte = Number(v & 0x7fn);
            v >>= 7n;
            if (v !== 0n) byte |= 0x80;
            this.ensureWritableSpace(1);
            this._dataView.setUint8(this._offset, byte);
            this._offset++;
        } while (v !== 0n);
        return this;
    }

    /**
     * Write VarInt
     * @param value {number} VarInt value
     * @returns {FlashBuffer} Current buffer instance
     */
    public writeVarInt(value: number): this {
        // zigzag encode
        const zigzag = (value << 1) ^ (value >> 31);
        return this.writeVarUint(zigzag);
    }

    /**
     * Write Sint32
     * @param value {number} Write Sint32 Value
     */
    public writeSint32(value: number): this {
        const zigzag = (value << 1) ^ (value >> 31);
        return this.writeVarUint(zigzag);
    }

    /**
     * Write Sint64 Value
     * @param value {bigint} Sint64 Value
     */
    public writeSint64(value: bigint): this {
        // zigzag encode for bigint: (value << 1) ^ (value >> 63)
        const zigzag = (value << 1n) ^ (value >> 63n);
        return this.writeVarUint64(zigzag);
    }
    // #endregion

    // #region Fixed64
    /**
     * Read Fixed32
     * @returns {number} Fixed32 Value
     */
    public readFixed32(): number {
        return this.readUint32(true);
    }

    /**
     * Read Fixed64
     * @returns {number} Fixed64 Value
     */
    public readFixed64(): bigint {
        return this.readBigUint64(true);
    }

    /**
     * Write Fixed32
     * @param value {number} Fixed32 Value
     */
    public writeFixed32(value: number): this {
        return this.writeUint32(value, true);
    }

    /**
     * Write Fixed64
     * @param value {number} Fixed64 Value
     */
    public writeFixed64(value: bigint): this {
        return this.writeBigUint64(value, true);
    }
    // #endregion

    // #region SFixed32
    /**
     * Read SFixed32 value
     * @returns {number} SFixed32 value
     */
    public readSFixed32(): number {
        return this.readInt32(true);
    }

    /**
     * Read SFixed64 value
     * @returns {bigint} SFixed64 Value
     */
    public readSFixed64(): bigint {
        return this.readBigInt64(true);
    }

    /**
     * Write SFixed64
     * @param value {bigint} SFixed64 value
     */
    public writeSFixed64(value: bigint): this {
        return this.writeBigInt64(value, true);
    }

    /**
     * Write SFixed32
     * @param value {number} SFixed32 Value
     */
    public writeSFixed32(value: number): this {
        return this.writeInt32(value, true);
    }
    // #region CString
    /**
     * Read CString
     * @returns {string} CString value
     */
    public readCString(): string {
        const start = this._offset;
        while (this._offset < this.size && this._dataView.getUint8(this._offset) !== 0) {
            this._offset++;
        }
        if (this._offset >= this.size) throw new Error('Unterminated C string');
        const length = this._offset - start;
        const view = new Uint8Array(this._buffer as ArrayBuffer, start, length);
        this._offset++; // skip null terminator
        return textDecoder.decode(view);
    }

    /**
     * Write CString
     * @param str {string} Value
     * @returns {FlashBuffer} Current buffer instance
     */
    public writeCString(str: string): this {
        const encoded = textEncoder.encode(str);
        this.writeBytes(encoded);
        this.writeUint8(0);
        return this;
    }
    // #endregion

    // #region Utils
    /**
     * Returns a new BinaryBuffer that shares the same underlying buffer,
     * but with independent offset (starting at current offset).
     * @param start {number} start offset
     * @param end {number} end offset
     * @returns {FlashBuffer} Current buffer instance
     */
    public slice(start: number = this._offset, end: number = this.size): FlashBuffer {
        const slicedBuffer = this._buffer.slice(start, end);
        return new FlashBuffer(slicedBuffer, { endianness: this._endianness });
    }

    /**
     * Add alignment
     * @param multiple {number} Multiple
     * @param fillByte {number} fill byte
     * @returns {FlashBuffer} Current buffer instance
     */
    public align(multiple: number, fillByte: number = 0): this {
        const remainder = this._offset % multiple;
        if (remainder !== 0) {
            const padding = multiple - remainder;
            this.ensureWritableSpace(padding);
            for (let i = 0; i < padding; i++) {
                this._dataView.setUint8(this._offset++, fillByte);
            }
        }
        return this;
    }

    /**
     * Bit Operations with FlashBitBuffer Instance
     * @returns {FlashBitBuffer} Bit buffer
     */
    public bit(): FlashBitBuffer {
        return new FlashBitBuffer(this);
    }

    /**
     * HEX Dump
     * @param options Options
     * @returns {string} HEX Dump string
     */
    public hexdump(options?: { offset?: number; length?: number; columns?: number }): string {
        const start = options?.offset ?? 0;
        const len = Math.min(options?.length ?? this.size - start, this.size - start);
        const cols = options?.columns ?? 16;
        const view = new Uint8Array(this._buffer as ArrayBuffer, start, len);
        let result = '';
        for (let i = 0; i < len; i += cols) {
            const chunk = view.slice(i, i + cols);
            const hex = Array.from(chunk, b => b.toString(16).padStart(2, '0')).join(' ');
            const ascii = Array.from(chunk, b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
            result += `${(start + i).toString(16).padStart(8, '0')}  ${hex.padEnd(cols * 3 - 1)}  |${ascii}|\n`;
        }
        return result;
    }
    // #endregion

    // #region Typed Arrays
    /**
     * Write Typed Array
     * @param array {Array} Typed array
     * @returns {FlashBuffer} Current buffer instance
     */
    public writeTypedArray<T extends ArrayBufferView>(array: T): this {
        const byteLength = array.byteLength;
        this.ensureWritableSpace(byteLength);
        new Uint8Array(this._buffer as ArrayBuffer, this._offset, byteLength).set(new Uint8Array(array.buffer, array.byteOffset, byteLength));
        this._offset += byteLength;
        return this;
    }

    /**
     * Read Typed Array
     * @param ctor
     * @param length {number} length
     * @returns {Array} Typed array
     */
    public readTypedArray<T extends ArrayBufferView>(ctor: { new(buffer: ArrayBuffer, byteOffset: number, length: number): T }, length: number): T {
        const byteLength = length * (ctor as any).BYTES_PER_ELEMENT;
        this.ensureReadable(byteLength);
        const array = new ctor(this._buffer as ArrayBuffer, this._offset, length);
        this._offset += byteLength;
        return array;
    }
    // #endregion

    // #region Buffers
    /**
     * Dispose from buffer pool
     */
    public dispose(): void {
        if (this._pool && this._autoRelease && this._buffer) {
            this._pool.release(this._buffer as ArrayBuffer);
            this._buffer = undefined as any;
        }
    }
    // #endregion

    // #region Utils
    /**
     * To Uint8 Array
     * @param copy {boolean} Copy values
     * @returns {Uint8Array} Array output
     */
    public toUint8Array(copy: boolean = false): Uint8Array {
        if (typeof (this as any)._byteOffset === 'number') {
            const view = new Uint8Array(
                (this as any)._buffer,
                (this as any)._byteOffset,
                (this as any)._byteLength ?? this._offset
            );

            return copy ? view.slice() : view;
        }

        const view = new Uint8Array(this._buffer, 0, this._offset);
        return copy ? view.slice() : view;
    }

    /**
     * From Uint8 Array
     * @param array {Uint8Array} Raw buffer
     * @param copy {boolean} copy values
     * @param options {FlashBufferOptions} FlashBuffer Options
     */
    public static fromUint8Array(
        array: Uint8Array,
        copy: boolean = false,
        options?: Omit<FlashBufferOptions, 'initialSize' | 'useShared'>
    ): FlashBuffer {
        if (copy) {
            const buffer = new ArrayBuffer(array.byteLength);
            new Uint8Array(buffer).set(array);
            return new FlashBuffer(buffer, options);
        }

        return new FlashBuffer(
            array.buffer,
            options
        );
    }

    /**
     * Copy from
     * @param data {Uint8Array} Input data
     * @param offset {number} Offset
     * @returns {FlashBuffer}
     */
    public copyFrom(data: Uint8Array, offset: number = 0): this {
        this.seek(offset);
        this.writeBytes(data);
        return this;
    }

    /**
     * Creates new patch and transform current buffer to newBuffer
     * @param newBuffer {FlashBuffer} Buffer to transform
     * @returns {FlashBuffer}
     */
    public diff(newBuffer: FlashBuffer): FlashBuffer {
        const oldData = this.toUint8Array();
        const newData = newBuffer.toUint8Array();
        const patch = createPatch(oldData, newData);
        const patchBuf = new FlashBuffer();
        patchBuf.writeBytes(patch);
        return patchBuf;
    }

    /**
     * Apply patch to current buffer and returns new buffer
     * @param patchBuffer {FlashBuffer}
     * @returns {FlashBuffer}
     */
    public applyPatch(patchBuffer: FlashBuffer): FlashBuffer {
        const oldData = this.toUint8Array();
        const patchData = patchBuffer.toUint8Array();
        const newData = applyPatch(oldData, patchData);
        const result = new FlashBuffer();
        result.writeBytes(newData);
        result.truncate();
        return result;
    }

    /**
     * Truncate buffer
     * @returns {FlashBuffer}
     */
    public truncate(): this {
        if (typeof (this as any)._byteLength === 'number') {
            (this as any)._byteLength = this._offset;
        } else {
            const exactBuffer = (SHARED_ARRAY_BUFFER_AVAILABLE && this._buffer instanceof SharedArrayBuffer) ? new SharedArrayBuffer(this._offset) : new ArrayBuffer(this._offset);
            new Uint8Array(exactBuffer).set(new Uint8Array(this._buffer, 0, this._offset));
            this._buffer = exactBuffer;
            this._dataView = new DataView(exactBuffer);
        }
        return this;
    }
    // #endregion
}