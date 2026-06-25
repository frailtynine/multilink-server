import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SignJWT, importPKCS8 } from 'jose';

export default async function getAppleMusicDevToken(): Promise<string> {
    const teamId = process.env.APPLE_DEV_TEAM_ID;
    const keyId = process.env.APPLE_DEV_KEY_ID;
    const keyPath = process.env.APPLE_DEV_KEY_PATH ?? `AuthKey_${keyId}.p8`;

    if (!teamId) {
        throw new Error('Missing APPLE_DEV_TEAM_ID');
    }

    if (!keyId) {
        throw new Error('Missing APPLE_DEV_KEY_ID');
    }

    const privateKeyPem = readFileSync(resolve(keyPath), 'utf8');
    const privateKey = await importPKCS8(privateKeyPem, 'ES256');

    return new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
        .setIssuer(teamId)
        .setIssuedAt()
        .setExpirationTime('180d')
        .sign(privateKey);
}
