/**
 * Flash Buffer conversion utils
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.6
 * @build               1001
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             20.04.2026
 */
/**
 * Conversion Utils
 */
export class ConvertUtils {
    /**
     * Convert raw text to bytes array
     * @param text {string} raw string
     * @returns {any} bytes array
     */
    public static textToBytes(text : string) : any {
        let self = this
        let result = [],
            i = 0
        text = encodeURI(text)
        while (i < text.length) {
            let c = text.charCodeAt(i++)

            // if it is a % sign, encode the following 2 bytes as a hex value
            if (c === 37) {
                result.push(parseInt(text.substr(i, 2), 16))
                i += 2

                // otherwise, just the actual byte
            } else {
                result.push(c)
            }
        }

        return self.coerceArray(result)
    }

    /**
     * Convert bytes array to raw string
     * @param bytes {number[]|Uint8Array} Bytes array
     * @returns {string} raw string
     */
    public static bytesToText(bytes : number[] | Uint8Array) : string {
        let result = [],
            i = 0

        while (i < bytes.length) {
            let c = bytes[i]

            if (c < 128) {
                result.push(String.fromCharCode(c))
                i++
            } else if (c > 191 && c < 224) {
                result.push(String.fromCharCode(((c & 0x1f) << 6) | (bytes[i + 1] & 0x3f)))
                i += 2
            } else {
                result.push(
                    String.fromCharCode(
                        ((c & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f),
                    ),
                )
                i += 3
            }
        }

        return result.join('')
    }

    /**
     * Coerce Array
     * @param arg {any} Argument
     * @param copy {any} Copy
     * @protected
     */
    private static coerceArray(arg : any, copy ? : any) : any {
        let self = this

        // ArrayBuffer view
        if (arg.buffer && arg.name === 'Uint8Array') {
            if (copy) {
                if (arg.slice) {
                    arg = arg.slice()
                } else {
                    arg = Array.prototype.slice.call(arg)
                }
            }

            return arg
        }

        // It's an array; check it is a valid representation of a byte
        if (Array.isArray(arg)) {
            if (!self.checkInts(arg)) {
                throw new Error('Array contains invalid value: ' + arg)
            }

            return new Uint8Array(arg)
        }

        // Something else, but behaves like an array (maybe a Buffer? Arguments?)
        if (self.checkInt(arg.length) && self.checkInts(arg)) {
            return new Uint8Array(arg)
        }

        throw new Error('unsupported array-like object')
    }

    /**
     * Check if value is int
     * @param value {any} Value
     * @returns {boolean}
     * @protected
     */
    private static checkInt(value: any) : boolean {
        return parseInt(value) === value
    }

    /**
     * Check Ints inside array
     * @param arrayish {any} Array
     * @returns {boolean} Any value is integer and between 0 and 255
     * @protected
     */
    private static checkInts(arrayish : any) : boolean {
        let self = this
        if (!self.checkInt(arrayish.length)) {
            return false
        }

        for (let i = 0; i < arrayish.length; i++) {
            if (!self.checkInt(arrayish[i]) || arrayish[i] < 0 || arrayish[i] > 255) {
                return false
            }
        }

        return true
    }
}