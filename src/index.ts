/**
 * Flash Buffer library
 * An extremely fast and optimized pure typescript binary buffer for your cross-platform real-time applications.
 * A modern approach to memory optimization and network packages.
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.6
 * @build               1009
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             20.04.2026
 */
/* Export core classes */
export * from "./core/types";
export * from "./core/buffer";
export * from "./core/bitbuffer";
export * from "./core/resizablebuffer";
export * from "./core/pool";
export * from "./core/writeablestream";
export * from "./core/readablestream";
export * from "./core/primitives";

/* Export Schema Tools */
export * from "./schema/decorators";
export * from "./schema/schema";
export * from "./schema/value-serializer";

/* Diff / Patch Support */
export * from "./diff";

/* Protobuf Support */
export * from "./protobuf";

/* Export Utils */
export * from "./utils/growthStrategies";
export * from "./utils/convert";