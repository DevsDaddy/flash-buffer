/**
 * Flash Buffer test configuration
 *
 * @developer           Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 */
/* Import required modules */
import { defineConfig } from 'vitest/config';

/**
 * Setup tests config
 */
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        setupFiles: ['reflect-metadata'],
    },
});