// Types for sword.js, the Emscripten loader that sword/build.sh generates.

export interface SwordModule {
  FS: {
    mkdir(path: string): void
    mount(type: unknown, opts: { root: string }, mountpoint: string): void
  }
  NODEFS: unknown
  cwrap(name: 'sw_open', returnType: 'number', argTypes: ['string']): (path: string) => number
  cwrap(name: 'sw_modules', returnType: 'string', argTypes: []): () => string
  cwrap(name: 'sw_passage', returnType: 'string', argTypes: ['string', 'string']): (module: string, osisRef: string) => string
  cwrap(name: 'sw_set_cipher_key', returnType: null, argTypes: ['string', 'string']): (module: string, key: string) => void
}

declare function createSword(options?: { locateFile?: (file: string) => string }): Promise<SwordModule>

export default createSword
