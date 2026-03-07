declare module 'node-jose' {
  export namespace JWK {
    interface Key {
      kid: string
      toPEM(): string
    }

    interface KeyStore {
      all(): Key[]
      get(kid: string): Key | null
    }

    function asKeyStore(jwks: any): Promise<KeyStore>
  }
}
