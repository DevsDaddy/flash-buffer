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
        const baseOffset = this.buffer.offset + this.byteOffset;

        let remaining = bits;
        let v = value;
        while (remaining > 0) {
            const freeBits = 8 - this.bitOffset;
            const writeBits = Math.min(remaining, freeBits);
            const mask = (1 << writeBits) - 1;
            const bitsToWrite = v & mask;
            const currentByte = dv.getUint8(baseOffset);
            const newByte = (currentByte & ~(mask << this.bitOffset)) | (bitsToWrite << this.bitOffset);
            dv.setUint8(baseOffset, newByte);
            v >>= writeBits;
            remaining -= writeBits;
            this.bitOffset += writeBits;
            if (this.bitOffset === 8) {
                this.bitOffset = 0;
                this.byteOffset++;
            }
        }
        return this;
    }

    /**
     * Read bits
     * @param bits {number} bits number
     * @returns {number} Bits
     */
    public readBits(bits: number): number {
        if (bits < 1 || bits > 32) throw new Error('Bits must be between 1 and 32');
        this.buffer.ensureReadable(this.byteOffset + Math.ceil((this.bitOffset + bits) / 8));
        const dv = this.buffer['_dataView'];
        const baseOffset = this.buffer.offset + this.byteOffset;

        let result = 0;
        let shift = 0;
        let remaining = bits;
        while (remaining > 0) {
            const freeBits = 8 - this.bitOffset;
            const readBits = Math.min(remaining, freeBits);
            const mask = (1 << readBits) - 1;
            const currentByte = dv.getUint8(baseOffset);
            const extracted = (currentByte >> this.bitOffset) & mask;
            result |= extracted << shift;
            shift += readBits;
            remaining -= readBits;
            this.bitOffset += readBits;
            if (this.bitOffset === 8) {
                this.bitOffset = 0;
                this.byteOffset++;
            }
        }
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
        this.buffer.ensureWritableSpace(bytesNeeded);
    }
}