/**
 * Flash Buffer types
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1004
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
import {FlashBuffer} from "./buffer";

/**
 * Endianness mode
 */
export enum Endianness {
    Big = 0,
    Little = 1
}

/**
 * Growth strategy
 */
export type GrowthStrategy = 'powerOfTwo' | 'exact' | 'fixed' | ((current: number, required: number) => number);

/**
 * Freezable buffer
 */
export interface Freezable {
    freeze(): ReadonlyFlashBuffer;
    isFrozen(): boolean;
}

/**
 * Read only binary buffer
 */
export type ReadonlyFlashBuffer = Omit<FlashBuffer, keyof Freezable | 'writeInt8' | 'writeUint8' | 'writeInt16' | 'writeUint16' | 'writeInt32' | 'writeUint32' | 'writeBigInt64' | 'writeBigUint64' | 'writeFloat32' | 'writeFloat64' | 'writeString' | 'writeBytes' | 'writeVarInt' | 'writeVarUint' | 'writeCString' | 'writeAligned' | 'writeBits'>;