import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import expressJwt from 'express-jwt';
import { URL_DEV } from './WebSocketServer';

interface WebSocketAuthResult {
  username: string | undefined;
  authorized: boolean;
}

const CLIENT_ID = 'd9MufLpgGizDwBqZFB5JJpt3rD3xmVME';
const DEVICES_CLIENT_ID = 'G2YqCMUuecbvIUWG5Fn092QXvPsxUXdU';
const AUTH_URL = `https://wiklosoft.eu.auth0.com/`;

const JWKS_RSA_OPTIONS = {
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `${AUTH_URL}.well-known/jwks.json`,
};

const JWT_OPTIONS = { audience: CLIENT_ID, issuer: AUTH_URL, algorithms: ['RS256'] };
const JWT_OPTIONS_DEVICE = { audience: DEVICES_CLIENT_ID, issuer: AUTH_URL, algorithms: ['RS256'] };

const client = jwksRsa(JWKS_RSA_OPTIONS);

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key: any) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function getJwtOptions(path: string | undefined) {
  return path === URL_DEV ? JWT_OPTIONS_DEVICE : JWT_OPTIONS;
}

function verifyToken(token: string | string[], path: string | undefined) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, getJwtOptions(path), function (err, decoded) {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

function getUserName(decodedToken): string {
  return decodedToken.name;
}

export async function authorizeWebSocket(token: string | string[], path: string | undefined): Promise<WebSocketAuthResult> {
  try {
    const decoded = await verifyToken(token, path);
    const username = await getUserName(decoded);
    return { authorized: true, username };
  } catch (e) {
    console.log(e);
  }
  return { authorized: false, username: undefined };
}

export const authorizeHttp = expressJwt({
  secret: jwksRsa.expressJwtSecret(JWKS_RSA_OPTIONS),
  ...JWT_OPTIONS,
});
