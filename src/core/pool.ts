/**
 * Flash Buffer Pool implementation
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 */
/**
 * Flash Buffer Pool stats
 */
export interface FlashBufferPoolStats {
    hits: number;
    misses: number;
    totalBuffers: number;
    poolSizes: FlashBufferPoolSize[];
}

/**
 * Flash Buffer Pool size
 */
export interface FlashBufferPoolSize {
    size: number;
    count: number;
}

/**
 * Flash Buffer Pool
 */
export class FlashBufferPool {
    // Pool Fields
    private pools = new Map<number, ArrayBuffer[]>();
    private readonly maxPoolSize: number;
    private _totalBuffers: number = 0;
    private _hits: number = 0;
    private _misses: number = 0;

    /**
     * Create buffer pool
     * @param maxPoolSize {number} Max pool size
     */
    constructor(maxPoolSize: number = 100) {
        this.maxPoolSize = maxPoolSize;
    }

    /**
     * Buffer usage statistic
     */
    public get stats() : FlashBufferPoolStats {
        return {
            hits: this._hits,
            misses: this._misses,
            totalBuffers: this._totalBuffers,
            poolSizes: Array.from(this.pools.entries()).map(([size, buffers]) => ({ size, count: buffers.length })),
        };
    }

    /**
     * Get number of buffers in pool
     */
    public get size(): number {
        return Array.from(this.pools.values()).reduce((sum, arr) => sum + arr.length, 0);
    }

    /**
     * Получить буфер нужного размера из пула или создать новый.
     * Возвращает ArrayBuffer с размером не менее запрошенного.
     */
    /**
     * Get buffer with required size from pool
     * or create new buffer
     * @param size {number} Buffer size
     * @returns {ArrayBuffer} Returns array buffer with size
     */
    public acquire(size: number): ArrayBuffer {
        const exactSize = Math.ceil(size);
        const pool = this.pools.get(exactSize);

        if (pool && pool.length > 0) {
            this._hits++;
            const buffer = pool.pop()!;
            new Uint8Array(buffer).fill(0);
            return buffer;
        }

        this._misses++;
        this._totalBuffers++;
        return new ArrayBuffer(exactSize);
    }

    /**
     * Return buffer into pool for re-use
     * @param buffer {ArrayBuffer} Buffer
     */
    public release(buffer: ArrayBuffer): void {
        const size = buffer.byteLength;
        let pool = this.pools.get(size);

        if (!pool) {
            pool = [];
            this.pools.set(size, pool);
        }

        if (pool.length < this.maxPoolSize) {
            pool.push(buffer);
        }
    }

    /**
     * Release all buffers and clean pool
     */
    public clear(): void {
        this.pools.clear();
        this._totalBuffers = 0;
        this._hits = 0;
        this._misses = 0;
    }
}

/* Default Pool */
export const defaultPool = new FlashBufferPool();