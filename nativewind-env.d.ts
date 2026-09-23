/// <reference types="nativewind/types" />

// Lets TypeScript accept `import "./global.css"` (NativeWind compiles it at build time).
declare module "*.css";
