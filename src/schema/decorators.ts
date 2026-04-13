/**
 * Flash Buffer Decorators
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1005
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
import 'reflect-metadata';
import {ProtobufType} from "../protobuf";

/* Add Schema Metadata Key */
const SCHEMA_METADATA_KEY = Symbol('binary:schema');

/* Flash buffer field types */
export type FlashBufferType = 'uint8' | 'int8' | 'uint16' | 'int16' | 'uint32' | 'int32' | 'uint64' |
    'int64' | 'float32' | 'float64' | 'string' | 'cstring' | 'varuint' | 'varint' |
    'varuint64' | 'sint32' | 'sint64' | 'fixed32' | 'fixed64' | 'sfixed32' | 'sfixed64';

/**
 * Field Options
 */
export interface FieldOptions {
    type?: FlashBufferType;
    littleEndian?: boolean;
    length?: number; // for strings: max length, or fixed length

    // For protobuf
    protoType?: ProtobufType;
    fieldNumber?: number;
}

/**
 * Field
 * @param options {FieldOptions} Field Options
 */
export function field(options: FieldOptions) {
    return (target: any, propertyKey: string) => {
        const fields = Reflect.getMetadata(SCHEMA_METADATA_KEY, target) || [];
        fields.push({ propertyKey, options });
        Reflect.defineMetadata(SCHEMA_METADATA_KEY, fields, target);
    };
}

/**
 * Get schema fields
 * @param target {any} Target
 */
export function getSchemaFields(target: any): Array<{ propertyKey: string; options: FieldOptions }> {
    return Reflect.getMetadata(SCHEMA_METADATA_KEY, target) || [];
}