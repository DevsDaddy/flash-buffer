/**
 * Flash Buffer Decorators
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 */
import 'reflect-metadata';

/* Add Schema Metadata Key */
const SCHEMA_METADATA_KEY = Symbol('binary:schema');

/**
 * Field Options
 */
export interface FieldOptions {
    type: 'uint8' | 'uint16' | 'uint32' | 'int32' | 'float32' | 'float64' | 'string' | 'cstring';
    littleEndian?: boolean;
    length?: number; // for strings: max length, or fixed length
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