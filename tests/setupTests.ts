// tests/setupTests.ts

// Mark this file as a module to satisfy --isolatedModules
export {};

(global as any).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};