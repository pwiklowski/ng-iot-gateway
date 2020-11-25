import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import expressJwt from 'express-jwt';

interface WebSocketAuthResult {
  username: string;
  authorized: boolean;
}

const CLIENT_ID = 'd9MufLpgGizDwBqZFB5JJpt3rD3xmVME';
const AUTH_URL = `https://wiklosoft.eu.auth0.com/`;

const JWKS_RSA_OPTIONS = {
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `${AUTH_URL}.well-known/jwks.json`,
};

const JWT_OPTIONS = { audience: CLIENT_ID, issuer: AUTH_URL, algorithms: ['RS256'] };

const client = jwksRsa(JWKS_RSA_OPTIONS);

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key: any) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

export async function authorizeWebSocket(token): Promise<WebSocketAuthResult> {
  return new Promise((resolve, reject) => {
    try {
      jwt.verify(token, getKey, JWT_OPTIONS, function (err, decoded) {
        resolve({ authorized: true, username: decoded.name });
      });
    } catch {
      reject({ authorized: true, username: null });
    }
  });
}

export const authorizeHttp = expressJwt({
  secret: jwksRsa.expressJwtSecret(JWKS_RSA_OPTIONS),
  ...JWT_OPTIONS,
});
