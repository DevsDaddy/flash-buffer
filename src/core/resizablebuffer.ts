/**
 * Flash Buffer Resizable implementation
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1004
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
/* Import Required Modules */
import {FlashBuffer, FlashBufferOptions} from "./buffer";

/**
 * Resizable FlashBuffer
 */
export class ResizableFlashBuffer extends FlashBuffer {
    private _maxByteLength: number;
    private readonly _isResizable: boolean;

    /**
     * Create Resizable FlashBuffer
     * @param initialSize {number} Initial size
     * @param maxByteLength {number} Max byte length
     * @param options {FlashBufferOptions} Buffer options
     */
    constructor(
        initialSize: number,
        maxByteLength?: number,
        options?: Omit<FlashBufferOptions, 'initialSize' | 'useShared' | 'growthStrategy'>
    );

    /**
     * Create Resizable FlashBuffer
     * @param buffer {ArrayBuffer|SharedArrayBuffer} Initial buffer
     * @param maxByteLength {number} Max byte length
     * @param options {FlashBufferOptions} Buffer options
     */
    constructor(
        buffer: ArrayBuffer | SharedArrayBuffer,
        maxByteLength?: number,
        options?: Omit<FlashBufferOptions, 'initialSize' | 'useShared' | 'growthStrategy'>
    );

    /**
     * Create Resizable FlashBuffer
     * @param bufferOrSize {number|ArrayBuffer|SharedArrayBuffer} Buffer initial size or initial buffer
     * @param maxByteLength {number} Max byte length
     * @param options {FlashBufferOptions} Buffer options
     */
    constructor(
        bufferOrSize: number | ArrayBuffer | SharedArrayBuffer,
        maxByteLength?: number,
        options?: Omit<FlashBufferOptions, 'initialSize' | 'useShared' | 'growthStrategy'>
    ) {
        let buffer: ArrayBuffer | SharedArrayBuffer;
        let max: number | undefined = maxByteLength;
        const opts = options ?? {};

        if (typeof bufferOrSize === 'number') {
            const size = bufferOrSize;
            max = maxByteLength ?? size * 2;
            if (typeof ArrayBuffer !== 'undefined' && 'resize' in ArrayBuffer.prototype) {
                // @ts-ignore
                buffer = new ArrayBuffer(size, { maxByteLength: max });
            } else {
                buffer = new ArrayBuffer(size);
            }
        } else {
            buffer = bufferOrSize;
            max = maxByteLength ?? buffer.byteLength;
        }

        super(buffer, { ...opts, growthStrategy: 'fixed' });

        this._maxByteLength = max;
        this._isResizable = this.checkResizable(buffer);
    }

    /**
     * Maximal byte length
     * @returns {number}
     */
    get maxByteLength(): number {
        return this._maxByteLength;
    }

    /**
     * If resizable
     * @returns {boolean}
     */
    public get isResizable(): boolean {
        return this._isResizable;
    }

    /**
     * Change buffer size (without data copy, if supported)
     * @param newSize
     * @throws Error if not support resizing or quota exceeds
     * @returns {ResizableFlashBuffer} Buffer instance
     */
    public resize(newSize: number): this {
        if (!this._isResizable) {
            throw new Error('Buffer is not resizable (either not an ArrayBuffer or resize not supported)');
        }
        if (newSize > this._maxByteLength) {
            throw new RangeError(`New size ${newSize} exceeds maxByteLength ${this._maxByteLength}`);
        }
        const buf = this._buffer as ArrayBuffer;
        // @ts-ignore
        buf.resize(newSize);
        this._dataView = new DataView(buf);
        return this;
    }

    /**
     * Ensure writeable space for resizable buffer
     * @param bytes {number} Bytes
     */
    public override ensureWritableSpace(bytes: number): void {
        this.ensureWritable();
        const required = this._offset + bytes;
        if (required > this.size) {
            this.grow(required);
        }
    }

    /**
     * Grow resizable buffer
     * if not supported - fallback copy
     * @param minSize {number} minimal size
     * @protected
     */
    protected override grow(minSize: number): void {
        if (this._isResizable) {
            if (minSize > this._maxByteLength) {
                throw new RangeError(`Cannot grow beyond maxByteLength ${this._maxByteLength}. Required: ${minSize}`);
            }
            this.resize(minSize);
        } else {
            const newBuffer = new ArrayBuffer(minSize);
            new Uint8Array(newBuffer).set(new Uint8Array(this._buffer as ArrayBuffer));
            this._buffer = newBuffer;
            this._dataView = new DataView(newBuffer);
        }
    }

    /**
     * Increase maximum allowed size (if resizable buffer - create new buffer)
     * @param newMax {number} New max
     * @returns {ResizableFlashBuffer} current buffer instance
     */
    public increaseMaxByteLength(newMax: number): this {
        if (!this._isResizable) {
            this._maxByteLength = newMax;
            return this;
        }
        if (newMax <= this._maxByteLength) return this;

        const oldBuffer = this._buffer as ArrayBuffer;
        // @ts-ignore
        const newBuffer = new ArrayBuffer(oldBuffer.byteLength, { maxByteLength: newMax });
        new Uint8Array(newBuffer).set(new Uint8Array(oldBuffer));
        this._buffer = newBuffer;
        this._dataView = new DataView(newBuffer);
        this._maxByteLength = newMax;
        return this;
    }

    /**
     * Check if resize is supported
     * @returns {boolean}
     */
    public static isResizeSupported(): boolean {
        return typeof ArrayBuffer !== 'undefined' && 'resize' in ArrayBuffer.prototype;
    }

    private checkResizable(buf: ArrayBuffer | SharedArrayBuffer): buf is ArrayBuffer & { resizable: true } {
        return buf instanceof ArrayBuffer && 'resize' in buf && (buf as any).resizable;
    }
}