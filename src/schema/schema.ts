/**
 * Flash Buffer schema support
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             12.04.2026
 */
/* Import required modules */
import {FlashBuffer} from "../core/buffer";
import {getSchemaFields} from "./decorators";

/**
 * Flash buffer schema
 */
export class FlashBufferSchema {
    /**
     * Serialize
     * @param obj {any} Object ot serialize
     * @param buffer {FlashBuffer} FlashBuffer
     * @returns {FlashBuffer}
     */
    static serialize<T extends object>(obj: T, buffer?: FlashBuffer): FlashBuffer {
        const buf = buffer || new FlashBuffer();
        const fields = getSchemaFields(obj.constructor.prototype);
        for (const { propertyKey, options } of fields) {
            const value = (obj as any)[propertyKey];
            switch (options.type) {
                case 'uint8': buf.writeUint8(value); break;
                case 'uint16': buf.writeUint16(value, options.littleEndian); break;
                case 'uint32': buf.writeUint32(value, options.littleEndian); break;
                case 'int32': buf.writeInt32(value, options.littleEndian); break;
                case 'float32': buf.writeFloat32(value, options.littleEndian); break;
                case 'float64': buf.writeFloat64(value, options.littleEndian); break;
                case 'varuint': buf.writeVarUint(value); break;
                case 'varint': buf.writeVarInt(value); break;
                case 'string': buf.writeString(value, 'utf-8', true); break;
                case 'cstring': buf.writeCString(value); break;
                default: throw new Error(`Unsupported type: ${options.type}`);
            }
        }
        return buf;
    }

    /**
     * Deserialize
     * @param ctor
     * @param buffer
     */
    static deserialize<T extends object>(ctor: new () => T, buffer: FlashBuffer): T {
        const obj = new ctor();
        const fields = getSchemaFields(ctor.prototype);
        for (const { propertyKey, options } of fields) {
            let value: any;
            switch (options.type) {
                case 'uint8': value = buffer.readUint8(); break;
                case 'uint16': value = buffer.readUint16(options.littleEndian); break;
                case 'uint32': value = buffer.readUint32(options.littleEndian); break;
                case 'int32': value = buffer.readInt32(options.littleEndian); break;
                case 'float32': value = buffer.readFloat32(options.littleEndian); break;
                case 'float64': value = buffer.readFloat64(options.littleEndian); break;
                case 'varuint': value = buffer.readVarUint(); break;
                case 'varint' : value = buffer.readVarInt(); break;
                case 'string': {
                    const len = buffer.readUint32();
                    value = buffer.readString(len);
                    break;
                }
                case 'cstring': value = buffer.readCString(); break;
                default: throw new Error(`Unsupported type: ${options.type}`);
            }
            (obj as any)[propertyKey] = value;
        }
        return obj;
    }
}