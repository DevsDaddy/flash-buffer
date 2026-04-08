/**
 * Flash Buffer implementation
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 */
/* Import required modules */
import {TextDecoder, TextEncoder} from 'util';
import {Endianness, Freezable, GrowthStrategy, ReadonlyFlashBuffer} from './types';
import {applyGrowthStrategy} from "../utils/growthStrategies";
import {FlashBitBuffer} from "./bitbuffer";
import {FlashBufferPool} from "./pool";

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

        if (bufferOrOptions instanceof ArrayBuffer || bufferOrOptions instanceof SharedArrayBuffer) {
            buffer = bufferOrOptions;
            opts = options ?? {};
        } else {
            opts = bufferOrOptions ?? {};
            const size = opts.initialSize ?? 1024;
            const useShared = opts.useShared ?? (typeof SharedArrayBuffer !== 'undefined');
            buffer = useShared ? new SharedArrayBuffer(size) : new ArrayBuffer(size);
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
        const newBuffer = this._buffer instanceof SharedArrayBuffer
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
    public readString(byteLength: number, encoding: string = 'utf-8'): string {
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
     * Read VarInt
     * @returns {number} VarInt value
     */
    public readVarInt(): number {
        const raw = this.readVarUint();
        // zigzag decode
        return (raw >>> 1) ^ -(raw & 1);
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
     * Write VarInt
     * @param value {number} VarInt value
     * @returns {FlashBuffer} Current buffer instance
     */
    public writeVarInt(value: number): this {
        // zigzag encode
        const zigzag = (value << 1) ^ (value >> 31);
        return this.writeVarUint(zigzag);
    }
    // #endregion

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
}