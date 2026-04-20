/**
 * Flash Buffer Readable Stream Support
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.6
 * @build               1005
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             20.04.2026
 */
import {ConvertUtils} from "../utils/convert";

/**
 * Flash Buffer Readable Stream Options
 */
export interface FlashReadableStreamOptions {
    /** Chunk size (by-defaults 64kb) */
    chunkSize?: number;
    /** Pool Buffer */
    pool?: import('../core/pool').FlashBufferPool;
}

/**
 * Flash Readable Stream
 */
export class FlashReadableStream {
    private reader: ReadableStreamDefaultReader<Uint8Array>;
    private currentChunk: Uint8Array | null = null;
    private chunkOffset: number = 0;
    private streamOffset: number = 0;
    private done: boolean = false;
    private readonly chunkSize: number;
    private readonly pool?: import('../core/pool').FlashBufferPool;

    /**
     * Create Flash Readable Stream
     * @param stream {ReadableStream<Uint8Array>} Readable stream
     * @param options {FlashReadableStreamOptions} Options
     */
    constructor(stream: ReadableStream<Uint8Array>, options: FlashReadableStreamOptions = {}) {
        this.reader = stream.getReader();
        this.chunkSize = options.chunkSize ?? 64 * 1024;
        this.pool = options.pool;
    }

    /**
     * Get Offset
     */
    public get offset(): number {
        return this.streamOffset;
    }

    /**
     * Read Uint8 from stream
     * @returns {Promise<number>} Uint8 Value
     */
    public async readUint8(): Promise<number> {
        await this.ensureChunk(1);
        if (!this.currentChunk) throw new RangeError('Stream ended unexpectedly');
        const value = this.currentChunk[this.chunkOffset];
        this.chunkOffset++;
        this.streamOffset++;
        return value;
    }

    /**
     * Read Uint16 from stream
     * @param littleEndian {boolean} is little endian
     * @returns {Promise<number>} Uint16 Value
     */
    public async readUint16(littleEndian?: boolean): Promise<number> {
        const bytes = await this.readBytes(2);
        const view = new DataView(bytes.buffer, bytes.byteOffset, 2);
        return view.getUint16(0, littleEndian);
    }

    /**
     * Read Uint32 from stream
     * @param littleEndian {boolean} is little endian
     * @returns {Promise<number>} Uint32 Value
     */
    public async readUint32(littleEndian?: boolean): Promise<number> {
        const bytes = await this.readBytes(4);
        const view = new DataView(bytes.buffer, bytes.byteOffset, 4);
        return view.getUint32(0, littleEndian);
    }
    /**
     * Read Int32 from stream
     * @param littleEndian {boolean} is little endian
     * @returns {Promise<number>} Int32 Value
     */
    public async readInt32(littleEndian?: boolean): Promise<number> {
        const bytes = await this.readBytes(4);
        const view = new DataView(bytes.buffer, bytes.byteOffset, 4);
        return view.getInt32(0, littleEndian);
    }

    /**
     * Read Float32 from stream
     * @param littleEndian {boolean} is little endian
     * @returns {Promise<number>} Float32 Value
     */
    public async readFloat32(littleEndian?: boolean): Promise<number> {
        const bytes = await this.readBytes(4);
        const view = new DataView(bytes.buffer, bytes.byteOffset, 4);
        return view.getFloat32(0, littleEndian);
    }

    /**
     * Read Float64 from stream
     * @param littleEndian {boolean} is little endian
     * @returns {Promise<number>} Float64 Value
     */
    public async readFloat64(littleEndian?: boolean): Promise<number> {
        const bytes = await this.readBytes(8);
        const view = new DataView(bytes.buffer, bytes.byteOffset, 8);
        return view.getFloat64(0, littleEndian);
    }

    /**
     * Read bytes from stream
     * @param length {number} Bytes length
     * @returns {Promise<Uint8Array>} Bytes buffer
     */
    public async readBytes(length: number): Promise<Uint8Array> {
        const result = new Uint8Array(length);
        let offset = 0;
        while (offset < length) {
            await this.ensureChunk(1);
            if (!this.currentChunk) {
                throw new RangeError(`Not enough data in stream: expected ${length} bytes, got ${offset}`);
            }
            const available = this.currentChunk.byteLength - this.chunkOffset;
            const toCopy = Math.min(available, length - offset);
            result.set(this.currentChunk.subarray(this.chunkOffset, this.chunkOffset + toCopy), offset);
            this.chunkOffset += toCopy;
            this.streamOffset += toCopy;
            offset += toCopy;
        }
        return result;
    }

    /**
     * Read string from stream
     * @param byteLength {number} Byte length
     * @param encoding {string} encoding
     * @returns {Promise<string>} String value from stream
     */
    public async readString(byteLength: number, encoding: string = 'utf-8'): Promise<string> {
        const bytes = await this.readBytes(byteLength);
        return ConvertUtils.bytesToText(bytes);
    }

    /**
     * Close readable stream
     */
    public async close(): Promise<void> {
        await this.reader.cancel();
        this.reader.releaseLock();
    }

    /**
     * Checks if end of stream
     * @returns {Promise<boolean>}
     */
    public async isEnd(): Promise<boolean> {
        if (this.currentChunk && this.chunkOffset < this.currentChunk.byteLength) return false;
        await this.ensureChunk(1);
        return this.done && (!this.currentChunk || this.chunkOffset >= this.currentChunk.byteLength);
    }

    private async ensureChunk(bytesNeeded: number = 1): Promise<void> {
        while (!this.done && (!this.currentChunk || this.chunkOffset + bytesNeeded > this.currentChunk.byteLength)) {
            const { value, done } = await this.reader.read();
            this.done = done;
            if (!done && value) {
                this.currentChunk = value;
                this.chunkOffset = 0;
            } else {
                this.currentChunk = null;
                break;
            }
        }
    }

    private checkAvailable(bytes: number): void {
        if (this.done && (!this.currentChunk || this.chunkOffset + bytes > this.currentChunk.byteLength)) {
            throw new RangeError(`Not enough data in stream: requested ${bytes} bytes, but only ${this.currentChunk ? this.currentChunk.byteLength - this.chunkOffset : 0} available`);
        }
    }

    private readFromChunk<T>(readFn: (view: DataView, offset: number) => T, byteLength: number): T {
        this.checkAvailable(byteLength);
        const view = new DataView(this.currentChunk!.buffer, this.currentChunk!.byteOffset + this.chunkOffset, byteLength);
        const value = readFn(view, 0);
        this.chunkOffset += byteLength;
        this.streamOffset += byteLength;
        return value;
    }
}