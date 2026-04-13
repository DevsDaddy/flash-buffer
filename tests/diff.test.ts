/**
 * Flash Buffer Diff / Patch Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1002
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
/* Import Required modules */
import { describe, it, expect } from 'vitest';
import { FlashBuffer } from '../src';

/**
 * Binary Diff / Patch
 */
describe('Binary Diff & Patch', () => {
    it('Must create patch and returns copy', () => {
        const oldBuf = new FlashBuffer();
        oldBuf.writeString('The quick brown fox jumps over the lazy dog.');

        const newBuf = new FlashBuffer();
        newBuf.writeString('The quick brown cat jumps over the lazy dog.');

        const patch = oldBuf.diff(newBuf);
        expect(patch.size).toBeGreaterThan(0);

        const reconstructed = oldBuf.applyPatch(patch);
        expect(reconstructed.toUint8Array()).toEqual(newBuf.toUint8Array());
    });

    it('Must works with an empty old buffer', () => {
        const oldBuf = new FlashBuffer();
        const newBuf = new FlashBuffer();
        newBuf.writeString('hello');

        const patch = oldBuf.diff(newBuf);
        const reconstructed = oldBuf.applyPatch(patch);
        expect(reconstructed.toUint8Array()).toEqual(newBuf.toUint8Array());
    });

    it('Must works with an empty new buffer', () => {
        const oldBuf = new FlashBuffer();
        oldBuf.writeString('delete me');
        const newBuf = new FlashBuffer();

        const patch = oldBuf.diff(newBuf);
        const reconstructed = oldBuf.applyPatch(patch);
        expect(reconstructed.size).toBe(0);
    });

    it('Must works with large random buffers', () => {
        const oldBuf = new FlashBuffer();
        const newBuf = new FlashBuffer();
        for (let i = 0; i < 5000; i++) {
            oldBuf.writeUint32(Math.floor(Math.random() * 0xFFFFFFFF));
        }
        const oldView = oldBuf.toUint8Array();
        const newView = new Uint8Array(oldView.length);
        newView.set(oldView);
        // Внесём несколько изменений
        newView[100] = 0xAA;
        newView[500] = 0xBB;
        newView[2000] = 0xCC;
        newBuf.writeBytes(newView);

        const patch = oldBuf.diff(newBuf);
        const reconstructed = oldBuf.applyPatch(patch);
        expect(reconstructed.toUint8Array()).toEqual(newBuf.toUint8Array());
    });
});