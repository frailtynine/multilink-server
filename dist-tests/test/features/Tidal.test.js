"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const Tidal_1 = __importStar(require("../../src/features/Tidal"));
const tidalSearchResponse = {
    data: {
        relationships: {
            albums: {
                data: [
                    {
                        id: '487367594',
                        type: 'albums',
                    },
                    {
                        id: '256083091',
                        type: 'albums',
                    },
                    {
                        id: '256098494',
                        type: 'albums',
                    },
                ],
            },
        },
    },
    included: [
        {
            id: '256083091',
            type: 'albums',
            attributes: {
                title: 'American Football (LP3)',
                releaseDate: '2019-03-22',
                externalLinks: [
                    {
                        href: 'https://tidal.com/browse/album/256083091',
                        meta: {
                            type: 'TIDAL_SHARING',
                        },
                    },
                ],
            },
        },
        {
            id: '256098494',
            type: 'albums',
            attributes: {
                title: 'American Football (LP2)',
                releaseDate: '2016-10-21',
                externalLinks: [
                    {
                        href: 'https://tidal.com/browse/album/256098494',
                        meta: {
                            type: 'TIDAL_SHARING',
                        },
                    },
                ],
            },
        },
        {
            id: '487367594',
            type: 'albums',
            attributes: {
                title: 'American Football (LP4)',
                releaseDate: '2026-05-01',
                externalLinks: [
                    {
                        href: 'https://tidal.com/browse/album/487367594',
                        meta: {
                            type: 'TIDAL_SHARING',
                        },
                    },
                ],
            },
        },
    ],
};
(0, node_test_1.default)('extractTidalAlbums returns related albums in API order', () => {
    strict_1.default.deepEqual((0, Tidal_1.extractTidalAlbums)(tidalSearchResponse).map((album) => album.id), ['487367594', '256083091', '256098494']);
});
(0, node_test_1.default)('findMatchingTidalAlbum matches the requested album by title and release date', () => {
    const matchingAlbum = (0, Tidal_1.findMatchingTidalAlbum)((0, Tidal_1.extractTidalAlbums)(tidalSearchResponse), 'American Football (LP4)', '2026-05-01');
    strict_1.default.equal(matchingAlbum?.id, '487367594');
});
(0, node_test_1.default)('getTidalAlbumUrl prefers the TIDAL_SHARING external link', () => {
    const matchingAlbum = (0, Tidal_1.findMatchingTidalAlbum)((0, Tidal_1.extractTidalAlbums)(tidalSearchResponse), 'American Football (LP4)', '2026-05-01');
    strict_1.default.equal((0, Tidal_1.getTidalAlbumUrl)(matchingAlbum), 'https://tidal.com/browse/album/487367594');
});
(0, node_test_1.default)('getTidalUrl authenticates with Tidal and returns the matched album URL', async () => {
    const originalFetch = globalThis.fetch;
    const originalClientId = process.env.TIDAL_CLIENT_ID;
    const originalClientSecret = process.env.TIDAL_CLIENT_SECRET;
    process.env.TIDAL_CLIENT_ID = 'tidal-client-id';
    process.env.TIDAL_CLIENT_SECRET = 'tidal-client-secret';
    try {
        globalThis.fetch = async (input, init) => {
            const url = String(input);
            if (url === 'https://auth.tidal.com/v1/oauth2/token') {
                strict_1.default.deepEqual(init, {
                    method: 'POST',
                    headers: {
                        Authorization: `Basic ${Buffer.from('tidal-client-id:tidal-client-secret').toString('base64')}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        grant_type: 'client_credentials',
                    }),
                });
                return new Response(JSON.stringify({ access_token: 'tidal-access-token' }), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            }
            strict_1.default.equal(url, 'https://openapi.tidal.com/v2/searchResults/American%20Football%20American%20Football%20(LP4)?include=albums&countryCode=US&explicitFilter=INCLUDE');
            strict_1.default.deepEqual(init, {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer tidal-access-token',
                    Accept: 'application/vnd.api+json',
                },
            });
            return new Response(JSON.stringify(tidalSearchResponse), {
                status: 200,
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                },
            });
        };
        strict_1.default.equal(await (0, Tidal_1.default)('American Football (LP4)', 'American Football', '2026-05-01'), 'https://tidal.com/browse/album/487367594');
    }
    finally {
        globalThis.fetch = originalFetch;
        if (originalClientId === undefined) {
            delete process.env.TIDAL_CLIENT_ID;
        }
        else {
            process.env.TIDAL_CLIENT_ID = originalClientId;
        }
        if (originalClientSecret === undefined) {
            delete process.env.TIDAL_CLIENT_SECRET;
        }
        else {
            process.env.TIDAL_CLIENT_SECRET = originalClientSecret;
        }
    }
});
