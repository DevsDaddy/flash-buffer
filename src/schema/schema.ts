/**
 * Flash Buffer schema support
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.5
 * @build               1012
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             20.04.2026
 */
/* Import required modules */
import {FlashBuffer} from "../core/buffer";
import {FieldOptions, getSchemaFields} from "./decorators";

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
    public static serialize<T extends object>(obj: T, buffer?: FlashBuffer): FlashBuffer {
        const buf = buffer || new FlashBuffer();
        const fields = getSchemaFields(obj.constructor.prototype);
        for (const { propertyKey, options } of fields) {
            const value = (obj as any)[propertyKey];
            switch (options.type) {
                case 'uint8': buf.writeUint8(value); break;
                case 'int8': buf.writeInt8(value); break;
                case 'uint16': buf.writeUint16(value, options.littleEndian); break;
                case 'int16': buf.writeInt16(value, options.littleEndian); break;
                case 'uint32': buf.writeUint32(value, options.littleEndian); break;
                case 'int32': buf.writeInt32(value, options.littleEndian); break;
                case 'uint64': buf.writeBigUint64(value, options.littleEndian); break;
                case 'int64': buf.writeBigInt64(value, options.littleEndian); break;
                case 'float32': buf.writeFloat32(value, options.littleEndian); break;
                case 'float64': buf.writeFloat64(value, options.littleEndian); break;
                case 'varuint': buf.writeVarUint(value); break;
                case 'varint': buf.writeVarInt(value); break;
                case 'varuint64': buf.writeVarUint64(value); break;
                case 'sint32': buf.writeSint32(value); break;
                case 'sint64': buf.writeSint64(value); break;
                case 'fixed32': buf.writeFixed32(value); break;
                case 'fixed64': buf.writeFixed64(value); break;
                case 'sfixed32': buf.writeSFixed32(value); break;
                case 'sfixed64': buf.writeSFixed64(value); break;
                case 'string': buf.writeString(value, 'utf-8', true); break;
                case 'cstring': buf.writeCString(value); break;
                case 'bool': buf.writeBool(value); break;
                case 'dynamic': buf.writeDynamic(value); break;
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
    public static deserialize<T extends object>(ctor: new () => T, buffer: FlashBuffer): T {
        const obj = new ctor();
        const fields = getSchemaFields(ctor.prototype);
        for (const { propertyKey, options } of fields) {
            let value: any;
            switch (options.type) {
                case 'uint8': value = buffer.readUint8(); break;
                case 'int8' : value = buffer.readInt8(); break;
                case 'uint16': value = buffer.readUint16(options.littleEndian); break;
                case 'int16': value = buffer.readInt16(options.littleEndian); break;
                case 'uint32': value = buffer.readUint32(options.littleEndian); break;
                case 'int32': value = buffer.readInt32(options.littleEndian); break;
                case 'uint64' : value = buffer.readBigUint64(options.littleEndian); break;
                case 'int64': value = buffer.readBigInt64(options.littleEndian); break;
                case 'float32': value = buffer.readFloat32(options.littleEndian); break;
                case 'float64': value = buffer.readFloat64(options.littleEndian); break;
                case 'varuint': value = buffer.readVarUint(); break;
                case 'varint' : value = buffer.readVarInt(); break;
                case 'varuint64': value = buffer.readVarUint64(); break;
                case 'sint32': value = buffer.readSint32(); break;
                case 'sint64': value = buffer.readSint64(); break;
                case 'fixed32': value = buffer.readFixed32(); break;
                case 'fixed64': value = buffer.readFixed64(); break;
                case 'sfixed32': value = buffer.readSFixed32(); break;
                case 'sfixed64': value = buffer.readSFixed64(); break;
                case 'string': value = buffer.readString(); break;
                case 'cstring': value = buffer.readCString(); break;
                case 'bool': value = buffer.readBool(); break;
                case 'dynamic': value = buffer.readDynamic(); break;
                default: throw new Error(`Unsupported type: ${options.type}`);
            }

            (obj as any)[propertyKey] = value;
        }
        return obj;
    }
}