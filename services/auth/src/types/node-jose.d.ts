declare module 'node-jose' {
  export namespace JWK {
    interface KeyStore {
      add(key: string, format: string, options?: Record<string, unknown>): Promise<unknown>;
      toJSON(privateKey?: boolean): { keys: unknown[] };
    }

    function createKeyStore(): KeyStore;
  }
}
