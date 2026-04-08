/**
 * Flash Buffer Writeable Stream Support
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 */
/**
 * Flash Buffer Writeable Stream Options
 */
export interface FlashWritableStreamOptions {
    /** Buffer size before send a chunk (by-defaults 64KB) */
    bufferSize?: number;
}

/**
 * Flash Writeable Stream
 */
export class FlashWritableStream {
    private writer: WritableStreamDefaultWriter<Uint8Array>;
    private buffer: Uint8Array;
    private bufferOffset: number = 0;
    private streamOffset: number = 0;

    /**
     * Create Writeable Stream
     * @param stream {WritableStream<Uint8Array>} Stream
     * @param options {FlashWritableStreamOptions} Options
     */
    constructor(stream: WritableStream<Uint8Array>, options: FlashWritableStreamOptions = {}) {
        this.writer = stream.getWriter();
        const bufferSize = options.bufferSize ?? 64 * 1024;
        this.buffer = new Uint8Array(bufferSize);
    }

    /**
     * Get Offset
     * @returns {number} Current Offset
     */
    public get offset(): number {
        return this.streamOffset;
    }

    /**
     * Write Uint8
     * @param value {number} Uint8 Value
     */
    public writeUint8(value: number): this {
        this.ensureSpace(1);
        new DataView(this.buffer.buffer).setUint8(this.bufferOffset, value);
        this.bufferOffset += 1;
        this.streamOffset += 1;
        return this;
    }

    /**
     * Write Uint16
     * @param value {number} Uint16 Value
     * @param littleEndian {boolean} is little endian
     */
    public writeUint16(value: number, littleEndian?: boolean): this {
        this.ensureSpace(2);
        new DataView(this.buffer.buffer).setUint16(this.bufferOffset, value, littleEndian);
        this.bufferOffset += 2;
        this.streamOffset += 2;
        return this;
    }

    /**
     * Write Uint32
     * @param value {number} Uint32 Value
     * @param littleEndian {boolean} is little endian
     */
    public writeUint32(value: number, littleEndian?: boolean): this {
        this.ensureSpace(4);
        new DataView(this.buffer.buffer).setUint32(this.bufferOffset, value, littleEndian);
        this.bufferOffset += 4;
        this.streamOffset += 4;
        return this;
    }

    /**
     * Write Int32
     * @param value {number} Int32 Value
     * @param littleEndian {boolean} is little endian
     */
    public writeInt32(value: number, littleEndian?: boolean): this {
        this.ensureSpace(4);
        new DataView(this.buffer.buffer).setInt32(this.bufferOffset, value, littleEndian);
        this.bufferOffset += 4;
        this.streamOffset += 4;
        return this;
    }

    /**
     * Write Float32
     * @param value {number} Float32 Value
     * @param littleEndian {boolean} is little endian
     */
    public writeFloat32(value: number, littleEndian?: boolean): this {
        this.ensureSpace(4);
        new DataView(this.buffer.buffer).setFloat32(this.bufferOffset, value, littleEndian);
        this.bufferOffset += 4;
        this.streamOffset += 4;
        return this;
    }

    /**
     * Write Float64
     * @param value {number} Float64 Value
     * @param littleEndian {boolean} is little endian
     */
    public writeFloat64(value: number, littleEndian?: boolean): this {
        this.ensureSpace(8);
        new DataView(this.buffer.buffer).setFloat64(this.bufferOffset, value, littleEndian);
        this.bufferOffset += 8;
        this.streamOffset += 8;
        return this;
    }

    /**
     * Write bytes
     * @param bytes {Uint8Array} Bytes
     */
    public writeBytes(bytes: Uint8Array): this {
        this.ensureSpace(bytes.byteLength);
        this.buffer.set(bytes, this.bufferOffset);
        this.bufferOffset += bytes.byteLength;
        this.streamOffset += bytes.byteLength;
        return this;
    }

    /**
     * Write string
     * @param str {string}
     */
    public writeString(str: string): this {
        const encoded = new TextEncoder().encode(str);
        return this.writeBytes(encoded);
    }

    /**
     * Stop writing, send data and close stream
     */
    public async close(): Promise<void> {
        await this.flush();
        await this.writer.close();
        this.writer.releaseLock();
    }

    /**
     * Force send bufferized data without close stream
     */
    public async flushAsync(): Promise<void> {
        await this.flush();
    }

    private async flush(): Promise<void> {
        if (this.bufferOffset > 0) {
            const chunk = this.buffer.slice(0, this.bufferOffset);
            await this.writer.write(chunk);
            this.bufferOffset = 0;
        }
    }

    private ensureSpace(bytes: number): void {
        if (this.bufferOffset + bytes > this.buffer.byteLength) {
            // Для простоты синхронно увеличиваем буфер (можно сделать асинхронный flush)
            // В реальном приложении лучше вызвать flush и начать новый чанк
            const newBuffer = new Uint8Array(Math.max(this.buffer.byteLength * 2, this.bufferOffset + bytes));
            newBuffer.set(this.buffer.subarray(0, this.bufferOffset));
            this.buffer = newBuffer;
        }
    }
}