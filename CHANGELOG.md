## Changelog
### v.1.1.6
This version is improvement for string conversion. Use it if you have a troubles with ``TextEncoder`` and shared buffers.

**What's new?**
- Added new ``ConvertUtils`` class;
- Replaced ``TextEncoder`` and ``TextDecoders`` anywhere;

---

### v.1.1.5
Meet the new version of **Flash Buffer** — even more convenient for serializing your data than ever before. New serialization types, dynamic object handling, improved schemas, and extensibility.

**What's new?**
- Added new ``boolean`` type for flash buffer and schema;
- Added dynamic serializer for objects of any type (methods: ``readDynamic`` and ``writeDynamic``);
- Added dynamic support for ``FlashBufferSchema``;

**Dynamic Serializer Example:**
```typescript
// Create custom class
class Person {
    constructor(public name: string, public age: number) {}
}

// Register custom class
registerClass(Person, {
    write(buf, p: Person) {
        buf.writeString(p.name, "utf-8", true);
        buf.writeUint8(p.age);
    },
    read(buf) {
        const name = buf.readString();
        const age = buf.readUint8();
        return new Person(name, age);
    }
});

// Create a dynamic object
interface IOriginal {
    id: number;
    name: string;
    isActive: boolean;
    createdAt: Date;
    tags: string[];
    profile: Person;
    metadata: Map<string, string>;
    data: Uint8Array;
}

// Deserialized object
const original : IOriginal = {
    id: 123,
    name: 'Alice',
    isActive: true,
    createdAt: new Date(),
    tags: ['admin', 'user'],
    profile: new Person('Alice', 30),
    metadata: new Map([['key', 'value']]),
    data: new Uint8Array([1, 2, 3]),
};

// Serialize and deserialize dynamically
buf.writeDynamic(original);
buf.reset();
const restored = buf.readDynamic<IOriginal>();
console.log(restored);
// restored equals to original
```

---

### v.1.1.4
New util methods for ``FlashBuffer`` presented in this version.

**What's new?**
- Changed method ``toUint8Array`` (added ``copy`` argument);
- Added new static method ``fromUint8Array`` for conversion;

---

### v.1.1.3
More stability with new fallback support in browsers for automatic mode.

**What's new?**
- Added fallback for ``SharedArrayBuffer``. This fallback uses if ``SharedArrayBuffer`` blocked in browser or not supported.

---

### v.1.1.2
**Hotfix:** Replaced TextEncoder to native from node.

---

### v.1.1.1 
Working with the library has become even more convenient thanks to more precise typing. Even more stability for your applications.

**What's new:**
- **Added branded types:** ``Uint8``, ``Int8``, ``Uint16LE``, ``Uint16BE``, ``Int16LE``, ``Int16BE``, ``Uint32LE``, ``Uint32BE``, ``Int32LE``, ``Int32BE``, ``Float32LE``, ``Float32BE``, ``Float64LE``, ``Float64BE``, ``BigUint64LE``, ``BigUint64BE``, ``BigInt64LE``, ``BigInt64BE``, ``VarUint32``, ``VarInt32``, ``VarUint64``
- **Added methods:** ``write`` and ``read`` to ``FlashBuffer`` for branded types;

---

### v.1.1.0 (13.04.2026)
**New Features:**
- **Added binary diff / path:** methods ``diff(newBuffer)``, ``applyPatch(patchBuffer)``;
- **Added new basic types:** (Sint32, Sint64, VarUint64, Fixed32, Fixed64, SFixed32, SFixed64);
- **Protobuf support:** Added protobuf reader / writer based on **Flash Buffer**;
- **Added new buffer utils:** ``truncate()``, ``toUint8Array()``, ``copyFrom(data, offset)``;

**Updates:**
- Added new types for FlashBuffer Schema;
- Added new tests for features;
- Update README with new examples;

---

### v.1.0.0 (09.04.2026)
Welcome to first public release of **FlashBuffer**!

> A lightning-fast, zero-copy binary data manipulation library for TypeScript.

### 🚀 Flash Buffer Features
- **Zero-Copy Operations:** Reading bytes returns a direct ``Uint8Array`` view into the underlying buffer, not a copy.

#### **Smart Memory Management:**
- **Automatic Offset Tracking:** The internal cursor advances automatically on reads and writes.
- **Dynamic Buffer Growth:** Buffers expand automatically when needed. Choose from ``exact``, ``powerOfTwo``, or ``fixed`` growth strategies.
- **Efficient Buffer Pool (FlashBufferPool):** Reuses buffers of similar sizes to reduce GC pressure.
- **Resizable ArrayBuffer:** Leverages the native ``ArrayBuffer.prototype.resize()`` for high-performance memory management.

#### **Cross-Platform:**
- **``SharedArrayBuffer`` Support:** Enables safe and efficient zero-copy data sharing between threads (Web Workers, Node.js Worker Threads).
- **Works Everywhere:** Runs seamlessly in modern browsers, Node.js, Deno, and Bun.

#### **Advanced Data Formats:**
- **VarInt (LEB128) with ZigZag Encoding:** Efficient storage for variable-length integers, commonly used in Protocol Buffers.
- **Bit-Level Operations (BitBuffer):** Read and write arbitrary numbers of bits (1-32) for flags, compressed data, and cryptography.
- **C-Strings (Null-Terminated Strings):** Convenient handling of strings found in system APIs and network protocols.
- **Streaming I/O:** Adapters for seamless integration with Web Streams API (``FlashReadableStream`` / ``FlashWritableStream``).

#### **Schema-Based Serialization (experimental):**
- **Declarative Schemas:** Define binary structures using TypeScript decorators (@field).
- **Automatic (De)Serialization:** The Schema class serializes and deserializes objects to and from binary buffers, eliminating manual errors.