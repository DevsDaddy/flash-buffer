/**
 * Flash Buffer Diff / Patch implementation
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1001
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
/**
 * Patch commands
 * 0 = COPY (oldOffset | length in VarInt)
 * 1 = insert (length | data)
 */
const enum Command {
    COPY = 0,
    INSERT = 1,
}

/**
 * Создаёт бинарный патч, преобразующий oldData в newData.
 */
/**
 * Creates a binary patch, transform oldData into newData
 * @param oldData {Uint8Array} Old data
 * @param newData {Uint8Array} New data
 * @returns {Uint8Array} Transformed array
 */
export function createPatch(oldData: Uint8Array, newData: Uint8Array): Uint8Array {
    const patchParts: Uint8Array[] = [];
    const hashMap = buildHashMap(oldData);

    let newPos = 0;
    while (newPos < newData.length) {
        const match = findLongestMatch(newData, newPos, oldData, hashMap);
        if (match.length >= 8) {
            appendCopy(patchParts, match.oldOffset, match.length);
            newPos += match.length;
        } else {
            const start = newPos;
            while (newPos < newData.length) {
                const m = findLongestMatch(newData, newPos, oldData, hashMap);
                if (m.length >= 8) break;
                newPos++;
            }
            appendInsert(patchParts, newData.subarray(start, newPos));
        }
    }
    return concatUint8Arrays(patchParts);
}

/**
 * Apply patch to oldData and returns newData
 * @param oldData {Uint8Array} Old data
 * @param patchData {Uint8Array} Patch data
 * @returns {Uint8Array} Transformed array
 */
export function applyPatch(oldData: Uint8Array, patchData: Uint8Array): Uint8Array {
    const resultParts: Uint8Array[] = [];
    let patchPos = 0;

    while (patchPos < patchData.length) {
        const cmd = patchData[patchPos++];
        if (cmd === Command.COPY) {
            const oldOffset = readVarUint(patchData, patchPos);
            patchPos += varUintLength(oldOffset);
            const length = readVarUint(patchData, patchPos);
            patchPos += varUintLength(length);
            resultParts.push(oldData.subarray(oldOffset, oldOffset + length));
        } else if (cmd === Command.INSERT) {
            const length = readVarUint(patchData, patchPos);
            patchPos += varUintLength(length);
            resultParts.push(patchData.subarray(patchPos, patchPos + length));
            patchPos += length;
        } else {
            throw new Error(`Unknown patch command: ${cmd}`);
        }
    }
    return concatUint8Arrays(resultParts);
}

// Util functions
function buildHashMap(data: Uint8Array): Map<number, number[]> {
    const map = new Map<number, number[]>();
    for (let i = 0; i <= data.length - 8; i++) {
        const hash = hash8(data, i);
        const list = map.get(hash);
        if (list) list.push(i);
        else map.set(hash, [i]);
    }
    return map;
}

function hash8(data: Uint8Array, offset: number): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < 8; i++) {
        h ^= data[offset + i];
        h = (h * 0x01000193) >>> 0;
    }
    return h;
}

function findLongestMatch(
    newData: Uint8Array,
    newPos: number,
    oldData: Uint8Array,
    hashMap: Map<number, number[]>
): { oldOffset: number; length: number } {
    if (newPos + 8 > newData.length) return { oldOffset: 0, length: 0 };

    const hash = hash8(newData, newPos);
    const candidates = hashMap.get(hash) || [];
    let bestLength = 0;
    let bestOffset = 0;

    for (const oldPos of candidates) {
        let len = 0;
        while (
            oldPos + len < oldData.length &&
            newPos + len < newData.length &&
            oldData[oldPos + len] === newData[newPos + len]
            ) {
            len++;
        }
        if (len > bestLength) {
            bestLength = len;
            bestOffset = oldPos;
        }
    }
    return { oldOffset: bestOffset, length: bestLength };
}

function writeVarUint(value: number): Uint8Array {
    const bytes: number[] = [];
    let v = value >>> 0;
    do {
        let byte = v & 0x7f;
        v >>>= 7;
        if (v !== 0) byte |= 0x80;
        bytes.push(byte);
    } while (v !== 0);
    return new Uint8Array(bytes);
}

function readVarUint(data: Uint8Array, offset: number): number {
    let result = 0;
    let shift = 0;
    let pos = offset;
    while (true) {
        const byte = data[pos++];
        result |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
    }
    return result >>> 0;
}

function varUintLength(value: number): number {
    return writeVarUint(value).length;
}

function appendCopy(parts: Uint8Array[], oldOffset: number, length: number): void {
    parts.push(new Uint8Array([Command.COPY]));
    parts.push(writeVarUint(oldOffset));
    parts.push(writeVarUint(length));
}

function appendInsert(parts: Uint8Array[], data: Uint8Array): void {
    parts.push(new Uint8Array([Command.INSERT]));
    parts.push(writeVarUint(data.length));
    parts.push(data);
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const total = arrays.reduce((sum, a) => sum + a.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) {
        result.set(a, offset);
        offset += a.length;
    }
    return result;
}