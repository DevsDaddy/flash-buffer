/**
 * Flash Buffer growth strategies
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1003
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             13.04.2026
 */
/* Import required modules */
import {GrowthStrategy} from "../core/types";

/**
 * Apply buffer growth strategy
 * @param currentSize {number} current size
 * @param requiredSize {number} required size
 * @param strategy {GrowthStrategy} growth strategy
 * @returns {number} new buffer size
 */
export function applyGrowthStrategy(
    currentSize: number,
    requiredSize: number,
    strategy: GrowthStrategy
): number {
    if (strategy === 'fixed') {
        throw new Error('Buffer cannot grow: growth strategy is "fixed"');
    }
    if (strategy === 'exact') {
        return Math.max(currentSize, requiredSize);
    }
    if (strategy === 'powerOfTwo') {
        let newSize = currentSize || 1;
        while (newSize < requiredSize) {
            newSize *= 2;
        }
        return newSize;
    }
    if (typeof strategy === 'function') {
        return strategy(currentSize, requiredSize);
    }
    // default: powerOfTwo
    let newSize = currentSize || 1;
    while (newSize < requiredSize) {
        newSize *= 2;
    }
    return newSize;
}