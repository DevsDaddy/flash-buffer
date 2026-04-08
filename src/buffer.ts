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
import {Endianness} from "./types";

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
    /** Growth factor when buffer needs to expand (e.g., 2.0 for doubling). */
    growthFactor?: number;
    /** Whether to use SharedArrayBuffer when creating a new buffer. */
    useShared?: boolean;
}

/**
 * Flash buffer implementation
 */
export class FlashBuffer {
    /* Buffer Parameters */
    private _buffer: ArrayBuffer | SharedArrayBuffer;
    private _dataView: DataView;
    private _offset: number = 0;
    private readonly _endianness: Endianness;
    private readonly _growthFactor: number;

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
        this._dataView = new DataView(buffer as ArrayBuffer); // DataView works with both
        this._endianness = opts.endianness ?? Endianness.Big;
        this._growthFactor = opts.growthFactor ?? 2.0;
    }

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

    // #region Reading
    /**
     * Read Int8
     * @returns {number} Int8 value
     */
    public readInt8(): number {
        return this._read((dv, off) => dv.getInt8(off), 1);
    }

    /**
     * Read Uint8 value
     * @returns {number} Uint8 value
     */
    public readUint8(): number {
        return this._read((dv, off) => dv.getUint8(off), 1);
    }

    /**
     * Read Int16 value
     * @param littleEndian {boolean} is little endian
     * @returns {number} Int16 value
     */
    public readInt16(littleEndian?: boolean): number {
        return this._read((dv, off, le) => dv.getInt16(off, le), 2, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Read Uint16 value
     * @param littleEndian {boolean} is little endian
     * @returns {number} Uint16 value
     */
    public readUint16(littleEndian?: boolean): number {
        return this._read((dv, off, le) => dv.getUint16(off, le), 2, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Read Int32 value
     * @param littleEndian {boolean} is little endian
     * @returns {number} Int32 value
     */
    public readInt32(littleEndian?: boolean): number {
        return this._read((dv, off, le) => dv.getInt32(off, le), 4, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Read Uint32 value
     * @param littleEndian {boolean} is little endian
     * @returns {number} Uint32 value
     */
    public readUint32(littleEndian?: boolean): number {
        return this._read((dv, off, le) => dv.getUint32(off, le), 4, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Read Int64 value
     * @param littleEndian {boolean} is little endian
     * @returns {bigint} Int64 value
     */
    public readBigInt64(littleEndian?: boolean): bigint {
        return this._read((dv, off, le) => dv.getBigInt64(off, le), 8, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Read Uint64 value
     * @param littleEndian {boolean} is little endian
     * @returns {bigint} Uint64 value
     */
    public readBigUint64(littleEndian?: boolean): bigint {
        return this._read((dv, off, le) => dv.getBigUint64(off, le), 8, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Read Float32 value
     * @param littleEndian {boolean} is little endian
     * @returns {number} Float32 value
     */
    public readFloat32(littleEndian?: boolean): number {
        return this._read((dv, off, le) => dv.getFloat32(off, le), 4, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Read Float64 value
     * @param littleEndian {boolean} is little endian
     * @returns {number} Float64 value
     */
    public readFloat64(littleEndian?: boolean): number {
        return this._read((dv, off, le) => dv.getFloat64(off, le), 8, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Reads a string of given byte length.
     * Uses TextDecoder; no extra copy is made (decoder works on the buffer view).
     * @param byteLength {number} buffer length
     * @param encoding {string} Text encoding
     * @returns {string} Raw string
     */
    public readString(byteLength: number, encoding: string = 'utf-8'): string {
        this._ensureReadable(byteLength);
        const view = new Uint8Array(this._buffer as ArrayBuffer, this._offset, byteLength);
        const str = new TextDecoder(encoding).decode(view);
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
        this._ensureReadable(length);
        const view = new Uint8Array(this._buffer as ArrayBuffer, this._offset, length);
        this._offset += length;
        return view;
    }

    private _read<T>(readFn: (dv: DataView, offset: number, littleEndian?: boolean) => T, byteLength: number, littleEndian?: boolean): T {
        this._ensureReadable(byteLength);
        const value = readFn(this._dataView, this._offset, littleEndian);
        this._offset += byteLength;
        return value;
    }

    private _ensureReadable(bytes: number): void {
        if (this._offset + bytes > this.size) {
            throw new RangeError(`Not enough data to read ${bytes} bytes at offset ${this._offset}`);
        }
    }
    // #endregion

    // #region Writing
    /**
     * Write Int8 value
     * @param value {number} Int8 value
     * @returns {FlashBuffer} current buffer instance
     */
    public writeInt8(value: number): this {
        return this._write((dv, off, v) => dv.setInt8(off, v), value, 1);
    }

    /**
     * Write Uint8 value
     * @param value {number} Uint8 value
     * @returns {FlashBuffer} current buffer instance
     */
    public writeUint8(value: number): this {
        return this._write((dv, off, v) => dv.setUint8(off, v), value, 1);
    }

    /**
     * Write Int16 value
     * @param value {number} Int16 value
     * @param littleEndian {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeInt16(value: number, littleEndian?: boolean): this {
        return this._write((dv, off, v, le) => dv.setInt16(off, v, le), value, 2, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Write Uint16 value
     * @param value {number} Uint16 value
     * @param littleEndian {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeUint16(value: number, littleEndian?: boolean): this {
        return this._write((dv, off, v, le) => dv.setUint16(off, v, le), value, 2, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Write Int32 value
     * @param value {number} Int32 value
     * @param littleEndian {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeInt32(value: number, littleEndian?: boolean): this {
        return this._write((dv, off, v, le) => dv.setInt32(off, v, le), value, 4, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Write Uint32 value
     * @param value {number} Uint32 value
     * @param littleEndian {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeUint32(value: number, littleEndian?: boolean): this {
        return this._write((dv, off, v, le) => dv.setUint32(off, v, le), value, 4, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Write BigInt64 value
     * @param value {bigint} BigInt64 value
     * @param littleEndian {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeBigInt64(value: bigint, littleEndian?: boolean): this {
        return this._write((dv, off, v, le) => dv.setBigInt64(off, v, le), value, 8, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Write BigUInt64 value
     * @param value {bigint} BigUInt64 value
     * @param littleEndian {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeBigUint64(value: bigint, littleEndian?: boolean): this {
        return this._write((dv, off, v, le) => dv.setBigUint64(off, v, le), value, 8, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Write Float32 value
     * @param value {number} Float32 value
     * @param littleEndian {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeFloat32(value: number, littleEndian?: boolean): this {
        return this._write((dv, off, v, le) => dv.setFloat32(off, v, le), value, 4, littleEndian ?? this._endianness === Endianness.Little);
    }

    /**
     * Write Float64 value
     * @param value {number} Float64 Value
     * @param littleEndian {boolean} is littleEndian
     * @returns {FlashBuffer} current buffer instance
     */
    public writeFloat64(value: number, littleEndian?: boolean): this {
        return this._write((dv, off, v, le) => dv.setFloat64(off, v, le), value, 8, littleEndian ?? this._endianness === Endianness.Little);
    }

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
        this._ensureWritable(length);
        new Uint8Array(this._buffer as ArrayBuffer, this._offset, length).set(bytes);
        this._offset += length;
        return this;
    }

    private _ensureWritable(bytes: number): void {
        const required = this._offset + bytes;
        if (required > this.size) {
            this._grow(required);
        }
    }

    private _grow(minSize: number): void {
        let newSize = this.size;
        while (newSize < minSize) {
            newSize = Math.max(newSize * this._growthFactor, minSize);
        }
        // Round up to nearest power of two optionally, but growthFactor is fine.
        const newBuffer = this._buffer instanceof SharedArrayBuffer
            ? new SharedArrayBuffer(newSize)
            : new ArrayBuffer(newSize);

        // Copy old data
        new Uint8Array(newBuffer).set(new Uint8Array(this._buffer as ArrayBuffer));
        this._buffer = newBuffer;
        this._dataView = new DataView(newBuffer as ArrayBuffer);
    }

    private _write<T>(writeFn: (dv: DataView, offset: number, value: T, littleEndian?: boolean) => void, value: T, byteLength: number, littleEndian?: boolean): this {
        this._ensureWritable(byteLength);
        writeFn(this._dataView, this._offset, value, littleEndian);
        this._offset += byteLength;
        return this;
    }
    // #endregion

    /**
     * Returns a new BinaryBuffer that shares the same underlying buffer,
     * but with independent offset (starting at current offset).
     * @param start {number} start offset
     * @param end {number} end offset
     * @returns {FlashBuffer} New flash buffer
     */
    public slice(start: number = this._offset, end: number = this.size): FlashBuffer {
        const slicedBuffer = this._buffer.slice(start, end);
        return new FlashBuffer(slicedBuffer, { endianness: this._endianness });
    }
}