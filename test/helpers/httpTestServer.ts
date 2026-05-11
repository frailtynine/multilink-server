import type { Express } from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface TestHttpServer {
    url: string;
    fetch: (path: string, init?: RequestInit) => Promise<Response>;
    close: () => Promise<void>;
}

export async function createTestHttpServer(app: Express): Promise<TestHttpServer> {
    const server = app.listen(0);

    await waitForServer(server);

    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;

    return {
        url: baseUrl,
        fetch: (path: string, init?: RequestInit) => fetch(`${baseUrl}${path}`, init),
        close: () => closeServer(server),
    };
}

async function waitForServer(server: Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });
}

async function closeServer(server: Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}
