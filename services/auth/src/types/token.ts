export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  departmentId?: string | null;
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  departmentId?: string | null;
  scope: string;
  iss: string;
  aud: string[];
  jti: string;
  sub: string;
  nbf: number;
  exp: number;
  iat: number;
}

export interface JWK {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

export interface JWKS {
  keys: JWK[];
}
