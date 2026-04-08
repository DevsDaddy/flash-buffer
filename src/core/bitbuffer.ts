/**
 * Flash Buffer BitBuffer implementation
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 */
/* Import required modules */
import {FlashBuffer} from "./buffer";

export class FlashBitBuffer {
    private readonly buffer: FlashBuffer;
    private bitOffset: number = 0; // 0-7 within current byte
    private byteOffset: number = 0; // relative to buffer's current offset

    /**
     * Create FlashBitBuffer from FlashBuffer
     * @param buffer {FlashBuffer} Binary buffer instance
     */
    constructor(buffer: FlashBuffer) {
        this.buffer = buffer;
    }

    /**
     * Write bits
     * @param value {number} value to write
     * @param bits {number} bits
     * @returns {FlashBitBuffer} current bit buffer
     */
    public writeBits(value: number, bits: number): this {
        if (bits < 1 || bits > 32) throw new Error('Bits must be between 1 and 32');
        this.ensureCapacity(bits);

        const dv = this.buffer['_dataView'];
        const baseOffset = this.buffer.offset;

        let remaining = bits;
        let v = value >>> 0;
        let currentByteOffset = baseOffset + this.byteOffset;
        let currentBitOffset = this.bitOffset;

        while (remaining > 0) {
            const freeBits = 8 - currentBitOffset;
            const writeBits = Math.min(remaining, freeBits);
            const mask = (1 << writeBits) - 1;
            const bitsToWrite = v & mask;
            const currentByte = dv.getUint8(currentByteOffset);
            const newByte = (currentByte & ~(mask << currentBitOffset)) | (bitsToWrite << currentBitOffset);
            dv.setUint8(currentByteOffset, newByte);

            v >>>= writeBits;
            remaining -= writeBits;
            currentBitOffset += writeBits;
            if (currentBitOffset === 8) {
                currentBitOffset = 0;
                currentByteOffset++;
            }
        }

        this.bitOffset = currentBitOffset;
        this.byteOffset = currentByteOffset - baseOffset;
        return this;
    }

    /**
     * Read bits
     * @param bits {number} bits number
     * @returns {number} Bits
     */
    public readBits(bits: number): number {
        if (bits < 1 || bits > 32) throw new Error('Bits must be between 1 and 32');
        this.ensureReadable(bits);

        const dv = this.buffer['_dataView'];
        const baseOffset = this.buffer.offset;

        let result = 0;
        let shift = 0;
        let remaining = bits;
        let currentByteOffset = baseOffset + this.byteOffset;
        let currentBitOffset = this.bitOffset;

        while (remaining > 0) {
            const freeBits = 8 - currentBitOffset;
            const readBits = Math.min(remaining, freeBits);
            const mask = (1 << readBits) - 1;
            const currentByte = dv.getUint8(currentByteOffset);
            const extracted = (currentByte >>> currentBitOffset) & mask;
            result |= extracted << shift;

            shift += readBits;
            remaining -= readBits;
            currentBitOffset += readBits;
            if (currentBitOffset === 8) {
                currentBitOffset = 0;
                currentByteOffset++;
            }
        }

        this.bitOffset = currentBitOffset;
        this.byteOffset = currentByteOffset - baseOffset;
        return result >>> 0;
    }

    /**
     * Flush buffer
     */
    public flush(): this {
        if (this.bitOffset > 0) {
            this.byteOffset++;
            this.bitOffset = 0;
        }
        this.buffer.skip(this.byteOffset);
        this.byteOffset = 0;
        return this;
    }

    private ensureCapacity(bits: number): void {
        const totalBits = this.bitOffset + bits;
        const bytesNeeded = Math.ceil(totalBits / 8);
        const totalBytesNeeded = this.byteOffset + bytesNeeded;
        this.buffer['ensureWritableSpace'](totalBytesNeeded);
    }

    private ensureReadable(bits: number): void {
        const totalBits = this.bitOffset + bits;
        const bytesNeeded = Math.ceil(totalBits / 8);
        const totalBytesNeeded = this.byteOffset + bytesNeeded;
        this.buffer['ensureReadable'](totalBytesNeeded);
    }
}