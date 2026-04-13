/**
 * Flash Buffer Protobuf types support
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1003
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
/**
 * Wire type (Protobuf)
 */
export enum ProtobufWireType {
    Varint = 0,
    Fixed64 = 1,
    LengthDelimited = 2,
    StartGroup = 3, // old
    EndGroup = 4,    // old
    Fixed32 = 5,
}

/**
 * Protobuf Tag
 */
export interface ProtobufTag {
    fieldNumber: number;
    wireType: ProtobufWireType;
}

/**
 * Decode protobuf tag
 * @param tagVarint {number} Tag
 * @returns {ProtobufTag} Protobuf tag
 */
export function protobufDecodeTag(tagVarint: number): ProtobufTag {
    return {
        fieldNumber: tagVarint >>> 3,
        wireType: tagVarint & 0x07,
    };
}

/**
 * Encode protobuf tag
 * @param fieldNumber {number} field number
 * @param wireType {ProtobufWireType} protobuf wire type
 * @returns {number} Tag variant
 */
export function protobufEncodeTag(fieldNumber: number, wireType: ProtobufWireType): number {
    return (fieldNumber << 3) | wireType;
}

/**
 * Protobuf supported field types
 */
export type ProtobufType = 'int32' | 'int64' | 'uint32' | 'uint64' | 'sint32' | 'sint64' | 'fixed32' | 'fixed64' | 'sfixed32' | 'sfixed64'
    | 'bool' | 'enum' | 'float' | 'double' | 'string' | 'bytes' | 'message';