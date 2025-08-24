// JSDOM lacks ResizeObserver. Stub it.
class ResizeObserver { observe(){} unobserve(){} disconnect(){} }
(global as any).ResizeObserver = ResizeObserver;