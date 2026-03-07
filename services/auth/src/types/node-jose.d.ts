declare module 'node-jose' {
  export namespace JWK {
    interface KeyStore {
      add(key: string, format: string, options?: any): Promise<any>;
      toJSON(privateKey?: boolean): any;
    }

    function createKeyStore(): KeyStore;
  }
}
