## Changelog
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