/**
 * Flash Buffer Pool Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { FlashBufferPool } from '../src/';

describe('BufferPool', () => {
    let pool: FlashBufferPool;

    beforeEach(() => {
        pool = new FlashBufferPool(5);
    });

    it('should acquire new buffer when pool is empty', () => {
        const buf = pool.acquire(16);
        expect(buf).toBeInstanceOf(ArrayBuffer);
        expect(buf.byteLength).toBe(16);
        expect(pool.stats.misses).toBe(1);
        expect(pool.stats.hits).toBe(0);
    });

    it('should reuse released buffer of exact size', () => {
        const buf1 = pool.acquire(32);
        // Запишем что-то, чтобы убедиться, что буфер очищается
        new Uint8Array(buf1)[0] = 42;
        pool.release(buf1);

        const buf2 = pool.acquire(32);
        expect(buf2).toBe(buf1); // тот же объект
        expect(new Uint8Array(buf2)[0]).toBe(0); // очищен
        expect(pool.stats.hits).toBe(1);
    });

    it('should not reuse buffer of different size', () => {
        const buf1 = pool.acquire(32);
        pool.release(buf1);

        const buf2 = pool.acquire(64);
        expect(buf2).not.toBe(buf1);
        expect(buf2.byteLength).toBe(64);
    });

    it('should limit pool size per size bucket', () => {
        const buffers: ArrayBuffer[] = [];
        for (let i = 0; i < 10; i++) {
            buffers.push(pool.acquire(16));
        }
        // Все вернём
        buffers.forEach(b => pool.release(b));

        // В пуле должно быть не более maxPoolSize (5)
        const poolSize = pool.stats.poolSizes.find(p => p.size === 16)?.count ?? 0;
        expect(poolSize).toBe(5);
    });

    it('should clear all buffers', () => {
        pool.acquire(10);
        pool.acquire(20);
        pool.clear();
        expect(pool.size).toBe(0);
        expect(pool.stats.totalBuffers).toBe(0);
    });

    it('should track statistics correctly', () => {
        pool.acquire(8);
        pool.acquire(8);
        const b = pool.acquire(8);
        pool.release(b);
        pool.acquire(8); // hit

        expect(pool.stats.misses).toBe(3);
        expect(pool.stats.hits).toBe(1);
        expect(pool.stats.totalBuffers).toBe(3);
    });
});