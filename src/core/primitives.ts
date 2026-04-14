/**
 * Flash Buffer Basic Primitives implementation
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1004
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
/* Import required modules */
import { FlashBuffer } from "./buffer";

/* Branding utils */
declare const __brand: unique symbol;
export type Brand<B> = { [__brand]: B };

/**
 * Typed value
 */
export interface TypedValue<T, B> {
    readonly value: T;
    readonly [__brand]: B;
}

/**
 * Typed factory
 */
export interface TypeFactory<T, B> {
    readonly size: number;
    create(value: T): T & Brand<B>;
    read(buf: FlashBuffer): T & Brand<B>;
    write(buf: FlashBuffer, value: T & Brand<B>): void;
}

// Basic types implementation
/**
 * Uint8
 */
export type Uint8 = number & Brand<'Uint8'>;
export const Uint8: TypeFactory<number, 'Uint8'> = {
    size: 1,
    create(value: number): Uint8 {
        if (!Number.isInteger(value) || value < 0 || value > 0xFF) {
            throw new RangeError(`Uint8 out of range: ${value}`);
        }
        return value as Uint8;
    },
    read(buf: FlashBuffer): Uint8 {
        return buf.readUint8() as Uint8;
    },
    write(buf: FlashBuffer, value: Uint8): void {
        buf.writeUint8(value);
    },
};

/**
 * Int8 Value
 */
export type Int8 = number & Brand<'Int8'>;
export const Int8: TypeFactory<number, 'Int8'> = {
    size: 1,
    create(value: number): Int8 {
        if (!Number.isInteger(value) || value < -0x80 || value > 0x7F) {
            throw new RangeError(`Int8 out of range: ${value}`);
        }
        return value as Int8;
    },
    read(buf: FlashBuffer): Int8 {
        return buf.readInt8() as Int8;
    },
    write(buf: FlashBuffer, value: Int8): void {
        buf.writeInt8(value);
    },
};

/**
 * Uint16
 */
export type Uint16LE = number & Brand<'Uint16LE'>;
export const Uint16LE: TypeFactory<number, 'Uint16LE'> = {
    size: 2,
    create(value: number): Uint16LE {
        if (!Number.isInteger(value) || value < 0 || value > 0xFFFF) {
            throw new RangeError(`Uint16 out of range: ${value}`);
        }
        return value as Uint16LE;
    },
    read(buf: FlashBuffer): Uint16LE {
        return buf.readUint16(true) as Uint16LE;
    },
    write(buf: FlashBuffer, value: Uint16LE): void {
        buf.writeUint16(value, true);
    },
};

export type Uint16BE = number & Brand<'Uint16BE'>;
export const Uint16BE: TypeFactory<number, 'Uint16BE'> = {
    size: 2,
    create(value: number): Uint16BE {
        if (!Number.isInteger(value) || value < 0 || value > 0xFFFF) {
            throw new RangeError(`Uint16 out of range: ${value}`);
        }
        return value as Uint16BE;
    },
    read(buf: FlashBuffer): Uint16BE {
        return buf.readUint16(false) as Uint16BE;
    },
    write(buf: FlashBuffer, value: Uint16BE): void {
        buf.writeUint16(value, false);
    },
};

/**
 * Int16
 */
export type Int16LE = number & Brand<'Int16LE'>;
export const Int16LE: TypeFactory<number, 'Int16LE'> = {
    size: 2,
    create(value: number): Int16LE {
        if (!Number.isInteger(value) || value < -0x8000 || value > 0x7FFF) {
            throw new RangeError(`Int16 out of range: ${value}`);
        }
        return value as Int16LE;
    },
    read(buf: FlashBuffer): Int16LE {
        return buf.readInt16(true) as Int16LE;
    },
    write(buf: FlashBuffer, value: Int16LE): void {
        buf.writeInt16(value, true);
    },
};

export type Int16BE = number & Brand<'Int16BE'>;
export const Int16BE: TypeFactory<number, 'Int16BE'> = {
    size: 2,
    create(value: number): Int16BE {
        if (!Number.isInteger(value) || value < -0x8000 || value > 0x7FFF) {
            throw new RangeError(`Int16 out of range: ${value}`);
        }
        return value as Int16BE;
    },
    read(buf: FlashBuffer): Int16BE {
        return buf.readInt16(false) as Int16BE;
    },
    write(buf: FlashBuffer, value: Int16BE): void {
        buf.writeInt16(value, false);
    },
};

/**
 * Unit32
 */
export type Uint32LE = number & Brand<'Uint32LE'>;
export const Uint32LE: TypeFactory<number, 'Uint32LE'> = {
    size: 4,
    create(value: number): Uint32LE {
        if (!Number.isInteger(value) || value < 0 || value > 0xFFFFFFFF) {
            throw new RangeError(`Uint32 out of range: ${value}`);
        }
        return value as Uint32LE;
    },
    read(buf: FlashBuffer): Uint32LE {
        return buf.readUint32(true) as Uint32LE;
    },
    write(buf: FlashBuffer, value: Uint32LE): void {
        buf.writeUint32(value, true);
    },
};

export type Uint32BE = number & Brand<'Uint32BE'>;
export const Uint32BE: TypeFactory<number, 'Uint32BE'> = {
    size: 4,
    create(value: number): Uint32BE {
        if (!Number.isInteger(value) || value < 0 || value > 0xFFFFFFFF) {
            throw new RangeError(`Uint32 out of range: ${value}`);
        }
        return value as Uint32BE;
    },
    read(buf: FlashBuffer): Uint32BE {
        return buf.readUint32(false) as Uint32BE;
    },
    write(buf: FlashBuffer, value: Uint32BE): void {
        buf.writeUint32(value, false);
    },
};

/**
 * Int32
 */
export type Int32LE = number & Brand<'Int32LE'>;
export const Int32LE: TypeFactory<number, 'Int32LE'> = {
    size: 4,
    create(value: number): Int32LE {
        if (!Number.isInteger(value) || value < -0x80000000 || value > 0x7FFFFFFF) {
            throw new RangeError(`Int32 out of range: ${value}`);
        }
        return value as Int32LE;
    },
    read(buf: FlashBuffer): Int32LE {
        return buf.readInt32(true) as Int32LE;
    },
    write(buf: FlashBuffer, value: Int32LE): void {
        buf.writeInt32(value, true);
    },
};

export type Int32BE = number & Brand<'Int32BE'>;
export const Int32BE: TypeFactory<number, 'Int32BE'> = {
    size: 4,
    create(value: number): Int32BE {
        if (!Number.isInteger(value) || value < -0x80000000 || value > 0x7FFFFFFF) {
            throw new RangeError(`Int32 out of range: ${value}`);
        }
        return value as Int32BE;
    },
    read(buf: FlashBuffer): Int32BE {
        return buf.readInt32(false) as Int32BE;
    },
    write(buf: FlashBuffer, value: Int32BE): void {
        buf.writeInt32(value, false);
    },
};

/**
 * Float32
 */
export type Float32LE = number & Brand<'Float32LE'>;
export const Float32LE: TypeFactory<number, 'Float32LE'> = {
    size: 4,
    create(value: number): Float32LE {
        if (typeof value !== 'number') throw new TypeError('Value must be a number');
        return value as Float32LE;
    },
    read(buf: FlashBuffer): Float32LE {
        return buf.readFloat32(true) as Float32LE;
    },
    write(buf: FlashBuffer, value: Float32LE): void {
        buf.writeFloat32(value, true);
    },
};

export type Float32BE = number & Brand<'Float32BE'>;
export const Float32BE: TypeFactory<number, 'Float32BE'> = {
    size: 4,
    create(value: number): Float32BE {
        if (typeof value !== 'number') throw new TypeError('Value must be a number');
        return value as Float32BE;
    },
    read(buf: FlashBuffer): Float32BE {
        return buf.readFloat32(false) as Float32BE;
    },
    write(buf: FlashBuffer, value: Float32BE): void {
        buf.writeFloat32(value, false);
    },
};

/**
 * Float64
 */
export type Float64LE = number & Brand<'Float64LE'>;
export const Float64LE: TypeFactory<number, 'Float64LE'> = {
    size: 8,
    create(value: number): Float64LE {
        if (typeof value !== 'number') throw new TypeError('Value must be a number');
        return value as Float64LE;
    },
    read(buf: FlashBuffer): Float64LE {
        return buf.readFloat64(true) as Float64LE;
    },
    write(buf: FlashBuffer, value: Float64LE): void {
        buf.writeFloat64(value, true);
    },
};

export type Float64BE = number & Brand<'Float64BE'>;
export const Float64BE: TypeFactory<number, 'Float64BE'> = {
    size: 8,
    create(value: number): Float64BE {
        if (typeof value !== 'number') throw new TypeError('Value must be a number');
        return value as Float64BE;
    },
    read(buf: FlashBuffer): Float64BE {
        return buf.readFloat64(false) as Float64BE;
    },
    write(buf: FlashBuffer, value: Float64BE): void {
        buf.writeFloat64(value, false);
    },
};

/**
 * BigInt
 */
export type BigUint64LE = bigint & Brand<'BigUint64LE'>;
export const BigUint64LE: TypeFactory<bigint, 'BigUint64LE'> = {
    size: 8,
    create(value: bigint): BigUint64LE {
        if (value < 0n || value > 0xFFFFFFFFFFFFFFFFn) {
            throw new RangeError(`BigUint64 out of range: ${value}`);
        }
        return value as BigUint64LE;
    },
    read(buf: FlashBuffer): BigUint64LE {
        return buf.readBigUint64(true) as BigUint64LE;
    },
    write(buf: FlashBuffer, value: BigUint64LE): void {
        buf.writeBigUint64(value, true);
    },
};

export type BigUint64BE = bigint & Brand<'BigUint64BE'>;
export const BigUint64BE: TypeFactory<bigint, 'BigUint64BE'> = {
    size: 8,
    create(value: bigint): BigUint64BE {
        if (value < 0n || value > 0xFFFFFFFFFFFFFFFFn) {
            throw new RangeError(`BigUint64 out of range: ${value}`);
        }
        return value as BigUint64BE;
    },
    read(buf: FlashBuffer): BigUint64BE {
        return buf.readBigUint64(false) as BigUint64BE;
    },
    write(buf: FlashBuffer, value: BigUint64BE): void {
        buf.writeBigUint64(value, false);
    },
};

export type BigInt64LE = bigint & Brand<'BigInt64LE'>;
export const BigInt64LE: TypeFactory<bigint, 'BigInt64LE'> = {
    size: 8,
    create(value: bigint): BigInt64LE {
        if (value < -0x8000000000000000n || value > 0x7FFFFFFFFFFFFFFFn) {
            throw new RangeError(`BigInt64 out of range: ${value}`);
        }
        return value as BigInt64LE;
    },
    read(buf: FlashBuffer): BigInt64LE {
        return buf.readBigInt64(true) as BigInt64LE;
    },
    write(buf: FlashBuffer, value: BigInt64LE): void {
        buf.writeBigInt64(value, true);
    },
};

export type BigInt64BE = bigint & Brand<'BigInt64BE'>;
export const BigInt64BE: TypeFactory<bigint, 'BigInt64BE'> = {
    size: 8,
    create(value: bigint): BigInt64BE {
        if (value < -0x8000000000000000n || value > 0x7FFFFFFFFFFFFFFFn) {
            throw new RangeError(`BigInt64 out of range: ${value}`);
        }
        return value as BigInt64BE;
    },
    read(buf: FlashBuffer): BigInt64BE {
        return buf.readBigInt64(false) as BigInt64BE;
    },
    write(buf: FlashBuffer, value: BigInt64BE): void {
        buf.writeBigInt64(value, false);
    },
};

// Additional Types
/**
 * VarUint32
 */
export type VarUint32 = number & Brand<'VarUint32'>;
export const VarUint32: TypeFactory<number, 'VarUint32'> = {
    size: -1, // переменный размер
    create(value: number): VarUint32 {
        if (!Number.isInteger(value) || value < 0 || value > 0xFFFFFFFF) {
            throw new RangeError(`VarUint32 out of range: ${value}`);
        }
        return value as VarUint32;
    },
    read(buf: FlashBuffer): VarUint32 {
        return buf.readVarUint() as VarUint32;
    },
    write(buf: FlashBuffer, value: VarUint32): void {
        buf.writeVarUint(value);
    },
};

export type VarInt32 = number & Brand<'VarInt32'>;
export const VarInt32: TypeFactory<number, 'VarInt32'> = {
    size: -1,
    create(value: number): VarInt32 {
        if (!Number.isInteger(value) || value < -0x80000000 || value > 0x7FFFFFFF) {
            throw new RangeError(`VarInt32 out of range: ${value}`);
        }
        return value as VarInt32;
    },
    read(buf: FlashBuffer): VarInt32 {
        return buf.readVarInt() as VarInt32;
    },
    write(buf: FlashBuffer, value: VarInt32): void {
        buf.writeVarInt(value);
    },
};

export type VarUint64 = bigint & Brand<'VarUint64'>;
export const VarUint64: TypeFactory<bigint, 'VarUint64'> = {
    size: -1,
    create(value: bigint): VarUint64 {
        if (value < 0n || value > 0xFFFFFFFFFFFFFFFFn) {
            throw new RangeError(`VarUint64 out of range: ${value}`);
        }
        return value as VarUint64;
    },
    read(buf: FlashBuffer): VarUint64 {
        return buf.readVarUint64() as VarUint64;
    },
    write(buf: FlashBuffer, value: VarUint64): void {
        buf.writeVarUint64(value);
    },
};