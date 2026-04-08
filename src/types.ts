/**
 * Flash Buffer types
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
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
 * Read only binary buffer
 */
export type ReadonlyBinaryBuffer = Omit<FlashBuffer, 'writeInt8' | 'writeUint8' | 'writeInt16' | 'writeUint16' | 'writeInt32' | 'writeUint32' | 'writeBigInt64' | 'writeBigUint64' | 'writeFloat32' | 'writeFloat64' | 'writeString' | 'writeBytes'>;