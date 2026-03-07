declare module '*/generate-keys' {
  export function generateKeys(): {
    privateKeyPath: string;
    publicKeyPath: string;
  };
}
