/**
 * Flash Buffer Value serializer
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.5
 * @build               1003
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             20.04.2026
 */
/* Import required */
import {FlashBuffer} from "../core/buffer";

/* Tag types */
export const enum ValueTypeTag {
    Null = 0,
    Undefined = 1,
    Boolean = 2,
    Number = 3,
    BigInt = 4,
    String = 5,
    Date = 6,
    RegExp = 7,
    Array = 8,
    Object = 9,
    Map = 10,
    Set = 11,
    Uint8Array = 12,
    // Reserved for future types
    Custom = 100,
}

/**
 * Value serializer
 */
export interface ValueSerializer<T> {
    write(buf: FlashBuffer, value: T): void;
    read(buf: FlashBuffer): T;
}

// Serializers and mapping
const serializers = new Map<ValueTypeTag, ValueSerializer<any>>();
const classToTag = new Map<Function, ValueTypeTag>();
let nextCustomTag = ValueTypeTag.Custom;

/**
 * Register class for serialization
 * @param constructor
 * @param serializer
 */
export function registerClass<T>(
    constructor: new (...args: any[]) => T,
    serializer: ValueSerializer<T>
): ValueTypeTag {
    const tag = nextCustomTag++;
    classToTag.set(constructor, tag);
    serializers.set(tag, serializer);
    return tag;
}

// Basic serializers
serializers.set(ValueTypeTag.Null, {
    write: () => {},
    read: () => null,
});
serializers.set(ValueTypeTag.Undefined, {
    write: () => {},
    read: () => undefined,
});
serializers.set(ValueTypeTag.Boolean, {
    write: (buf, v) => buf.writeUint8(v ? 1 : 0),
    read: (buf) => buf.readUint8() !== 0,
});
serializers.set(ValueTypeTag.Number, {
    write: (buf, v) => buf.writeFloat64(v, true),
    read: (buf) => buf.readFloat64(true),
});
serializers.set(ValueTypeTag.BigInt, {
    write: (buf, v) => {
        buf.writeBigInt64(v);
    },
    read: (buf) => buf.readBigInt64(),
});
serializers.set(ValueTypeTag.String, {
    write: (buf, v) => buf.writeString(v, "utf-8", true),
    read: (buf) => buf.readString(),
});
serializers.set(ValueTypeTag.Date, {
    write: (buf, v) => buf.writeFloat64(v.getTime(), true),
    read: (buf) => new Date(buf.readFloat64(true)),
});
serializers.set(ValueTypeTag.RegExp, {
    write: (buf, v) => {
        buf.writeString(v.source, "utf-8", true);
        buf.writeString(v.flags, "utf-8", true);
    },
    read: (buf) => {
        const source = buf.readString();
        const flags = buf.readString();
        return new RegExp(source, flags);
    },
});
serializers.set(ValueTypeTag.Array, {
    write: (buf, arr: any[]) => {
        buf.writeVarUint(arr.length);
        for (const item of arr) {
            writeValueDynamic(buf, item);
        }
    },
    read: (buf) => {
        const len = buf.readVarUint();
        const result = [];
        for (let i = 0; i < len; i++) {
            result.push(readValueDynamic(buf));
        }
        return result;
    },
});
serializers.set(ValueTypeTag.Object, {
    write: (buf, obj: Record<string, any>) => {
        const keys = Object.keys(obj);
        buf.writeVarUint(keys.length);
        for (const key of keys) {
            buf.writeString(key, "utf-8", true);
            writeValueDynamic(buf, obj[key]);
        }
    },
    read: (buf) => {
        const len = buf.readVarUint();
        const obj: any = {};
        for (let i = 0; i < len; i++) {
            const key = buf.readString();
            obj[key] = readValueDynamic(buf);
        }
        return obj;
    },
});
serializers.set(ValueTypeTag.Map, {
    write: (buf, map: Map<any, any>) => {
        const entries = Array.from(map.entries());
        buf.writeVarUint(entries.length);
        for (const [key, value] of entries) {
            writeValueDynamic(buf, key);
            writeValueDynamic(buf, value);
        }
    },
    read: (buf) => {
        const len = buf.readVarUint();
        const map = new Map();
        for (let i = 0; i < len; i++) {
            const key = readValueDynamic(buf);
            const value = readValueDynamic(buf);
            map.set(key, value);
        }
        return map;
    },
});
serializers.set(ValueTypeTag.Set, {
    write: (buf, set: Set<any>) => {
        const values = Array.from(set.values());
        buf.writeVarUint(values.length);
        for (const value of values) {
            writeValueDynamic(buf, value);
        }
    },
    read: (buf) => {
        const len = buf.readVarUint();
        const set = new Set();
        for (let i = 0; i < len; i++) {
            set.add(readValueDynamic(buf));
        }
        return set;
    },
});
serializers.set(ValueTypeTag.Uint8Array, {
    write: (buf, arr: Uint8Array) => {
        buf.writeVarUint(arr.byteLength);
        buf.writeBytes(arr);
    },
    read: (buf) => {
        const len = buf.readVarUint();
        return buf.readBytes(len);
    },
});


/**
 * Write value dynamic
 * @param buf {FlashBuffer} Buffer
 * @param value {any} Dynamic value
 */
export function writeValueDynamic(buf: FlashBuffer, value: any): void {
    if (value === null) {
        buf.writeUint8(ValueTypeTag.Null);
        return;
    }
    if (value === undefined) {
        buf.writeUint8(ValueTypeTag.Undefined);
        return;
    }

    const type = typeof value;
    if (type === 'boolean') {
        buf.writeUint8(ValueTypeTag.Boolean);
        serializers.get(ValueTypeTag.Boolean)!.write(buf, value);
    } else if (type === 'number') {
        buf.writeUint8(ValueTypeTag.Number);
        serializers.get(ValueTypeTag.Number)!.write(buf, value);
    } else if (type === 'bigint') {
        buf.writeUint8(ValueTypeTag.BigInt);
        serializers.get(ValueTypeTag.BigInt)!.write(buf, value);
    } else if (type === 'string') {
        buf.writeUint8(ValueTypeTag.String);
        serializers.get(ValueTypeTag.String)!.write(buf, value);
    } else if (value instanceof Date) {
        buf.writeUint8(ValueTypeTag.Date);
        serializers.get(ValueTypeTag.Date)!.write(buf, value);
    } else if (value instanceof RegExp) {
        buf.writeUint8(ValueTypeTag.RegExp);
        serializers.get(ValueTypeTag.RegExp)!.write(buf, value);
    } else if (Array.isArray(value)) {
        buf.writeUint8(ValueTypeTag.Array);
        serializers.get(ValueTypeTag.Array)!.write(buf, value);
    } else if (value instanceof Map) {
        buf.writeUint8(ValueTypeTag.Map);
        serializers.get(ValueTypeTag.Map)!.write(buf, value);
    } else if (value instanceof Set) {
        buf.writeUint8(ValueTypeTag.Set);
        serializers.get(ValueTypeTag.Set)!.write(buf, value);
    } else if (value instanceof Uint8Array) {
        buf.writeUint8(ValueTypeTag.Uint8Array);
        serializers.get(ValueTypeTag.Uint8Array)!.write(buf, value);
    } else {
        // Check registered user classes
        const proto = Object.getPrototypeOf(value);
        const tag = classToTag.get(proto?.constructor);
        if (tag !== undefined) {
            buf.writeUint8(tag);
            serializers.get(tag)!.write(buf, value);
        } else {
            // Fallback: default object
            buf.writeUint8(ValueTypeTag.Object);
            serializers.get(ValueTypeTag.Object)!.write(buf, value);
        }
    }
}

/**
 * Read dynamic value
 * @param buf {FlashBuffer} Flash Buffer
 * @returns {any} Dynamic Value
 */
export function readValueDynamic(buf: FlashBuffer): any {
    const tag = buf.readUint8() as ValueTypeTag;
    const serializer = serializers.get(tag);
    if (!serializer) {
        throw new Error(`Unknown value type tag: ${tag}`);
    }
    return serializer.read(buf);
}