import { Request } from 'express';

export function expressAuthentication(
    request: Request,
    securityName: string,
): Promise<any> {
    if (securityName === 'api_token') {
        const token = request.headers['authorization'];
        const validToken = process.env.API_TOKEN;

        if (!validToken) {
            throw new Error('API_TOKEN not configured');
        }

        if (token === validToken || token === `Bearer ${validToken}`) {
            return Promise.resolve({
                authenticated: true
            });
        } else {
            return Promise.reject(new Error('Unauthorized'));
        }
    }

    return Promise.reject(new Error('Unknown security type'));
}