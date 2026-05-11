"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestHttpServer = createTestHttpServer;
async function createTestHttpServer(app) {
    const server = app.listen(0);
    await waitForServer(server);
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;
    return {
        url: baseUrl,
        fetch: (path, init) => fetch(`${baseUrl}${path}`, init),
        close: () => closeServer(server),
    };
}
async function waitForServer(server) {
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });
}
async function closeServer(server) {
    await new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
