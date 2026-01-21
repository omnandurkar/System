import { SignJWT, jwtVerify } from 'jose';

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'system-secret-key-change-me');

export async function decrypt(input) {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    });
    return payload;
}
