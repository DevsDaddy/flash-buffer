# Welcome to ⚡ Flash Buffer
![Flash Buffer NPM](https://badge.fury.io/js/flash-buffer.svg) ![Flash Buffer - MIT opensource](https://img.shields.io/badge/License-MIT-yellow.svg)

> A lightning-fast, zero-copy binary data manipulation library for TypeScript.

**⚡ FlashBuffer** provides a powerful and convenient API for reading from and writing to ``ArrayBuffer`` and ``SharedArrayBuffer``. It eliminates manual offset tracking, automatically manages buffer growth, and is designed for maximum performance by avoiding unnecessary memory copying wherever possible. 

**The library includes a suite of advanced tools:** from bit-level operations and VarInt encoding to declarative object serialization.

---

[About](#about-flash-buffer) | [Get Started](#get-started) | [Samples](#-usage-examples) | [Comparison](#-comparison-with-alternatives) | [Contact Me](mailto:ilya@neurosell.top)

---

## About Flash Buffer
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

---

## Get Started
### 📦 Installation
**From NPM:**
```bash
npm install flash-buffer
```

**Or from sources:**
```bash
git clone https://github.com/devsdaddy/flash-buffer/flash-buffer.git
git cd ./flash-buffer/
```

### 💻 Usage Examples
#### Basic Reading and Writing

```typescript
import { FlashBuffer } from 'flash-buffer';

// Create a buffer (auto-growing, little-endian by default)
const buf = new FlashBuffer({ endianness: 'little' });

// Write data
buf.writeUint32(0xDEADBEEF);
buf.writeString('Hello, Flash!', 'utf-8', true); // true = prefix length as uint32

// Reset the offset for reading
buf.reset();

// Read data back
const value = buf.readUint32();
const strLength = buf.readUint32();
const str = buf.readString(strLength);

console.log(value.toString(16)); // 'deadbeef'
console.log(str);               // 'Hello, Flash!'
```

#### Working with VarInt (Variable-Length Integers)
```typescript
import { FlashBuffer } from 'flash-buffer';

const buf = new FlashBuffer();

// Write a large number (less than 128) in one byte instead of four
buf.writeVarUint(127);

// Write a negative number efficiently using ZigZag encoding
buf.writeVarInt(-15);

buf.reset();

console.log(buf.readVarUint()); // 127
console.log(buf.readVarInt());  // -15
console.log(buf.offset);        // 3 (1 byte for 127 + 2 bytes for -15)
```

#### Bit-Level Operations
```typescript
import { FlashBuffer } from 'flash-buffer';

const buf = new FlashBuffer();
const bits = buf.bit();

// Write a sequence of bits that may cross byte boundaries
bits.writeBits(0b11111, 5);
bits.writeBits(0b10101, 5);
bits.flush(); // Important: flush to finalize the byte and align the offset

buf.reset();
const readBits = buf.bit();
console.log(readBits.readBits(5)); // 0b11111 (31)
console.log(readBits.readBits(5)); // 0b10101 (21)
```

### NPM Commands
| Command | Usage                         |
|-------|-------------------------------|
| npm run build | Build dist package            |
| npm run test | Run tests (43 tests included) |
| npm run bench | Run benchmarks                |

---

## 📊 Comparison with Alternatives
Several excellent libraries exist for binary data manipulation. **Flash Buffer** was designed to combine their strengths and offer unique capabilities.

| Feature                     | flash-buffer | smart-buffer | @hazae41/binary | @jsonjoy.com/buffers |
|-----------------------------|---| ------------ | --------------- | -------------------- |
| **Zero-Copy**               | ✅ | ❌             | ✅                |  ❌                    |
| ``**SharedArrayBuffer**``   | ✅  | ❌             | ❌                | ❌                     |
| **Automatic Growth**        | ✅  | ✅             |  ❌               | ✅                     |
| **Streaming (Web Streams)** | ✅  | ❌             | ❌                | ✅                     |
| **Bit-Level Operations**    | ✅  | ❌             | ❌                | ❌                     |
| **VarInt (LEB128)**         | ✅  | ❌             | ❌                | ❌                     |
| **C-Strings**               | ✅  | ✅             | ❌                |  ❌                    |
| **Schema Serialization**    | ✅  | ❌             | ✅                |  ❌                    |
| **Buffer Pool**             | ✅  | ❌             | ❌                | ❌                     |

### Advantages of flash-buffer
- **Built-in ``SharedArrayBuffer`` Support:** This is a key differentiator, unlocking high-performance multi-threading without unnecessary data copying. It is essential for resource-intensive client applications and high-load servers.
- **Modern and Intuitive API:** The API is inspired by the native DataView, making it easy to learn and use.
- **Powerful Toolset:** ``flash-buffer`` is not just a reader/writer. It is a comprehensive toolkit including VarInt, bit-level operations, and streaming adapters, allowing you to solve 99% of binary data tasks without pulling in additional libraries.

---

**Flash Buffer** library is distributed under the MIT license. You can use it however you like. I would appreciate any feedback and suggestions for improvement.
Full license text [can be found here](https://github.com/devsdaddy/quarkdash/blob/main/LICENSE)

**Have a questions?** [Contact me](mailto:ilya@neurosell.top)

---

[About](#about-flash-buffer) | [Get Started](#get-started) | [Comparison](#-comparison-with-alternatives)