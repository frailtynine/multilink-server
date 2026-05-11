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
const Deezer_1 = __importStar(require("../../src/features/Deezer"));
const deezerSearchResponse = {
    data: [
        {
            id: 933527471,
            title: 'American Football (LP4)',
            link: 'https://www.deezer.com/album/933527471',
            artist: {
                id: 123,
                name: 'American Football',
            },
            type: 'album',
        },
        {
            id: 111111111,
            title: 'American Football (LP3)',
            link: 'https://www.deezer.com/album/111111111',
            artist: {
                id: 123,
                name: 'American Football',
            },
            type: 'album',
        },
    ],
    total: 2,
};
function createMockDeezerClient(searchResponse) {
    let albumFilter = '';
    return {
        search: {
            builder(query) {
                let baseQuery = query ?? '';
                return {
                    album(title) {
                        albumFilter = title;
                        baseQuery = `${baseQuery} album:"${title}"`;
                        return this;
                    },
                    build() {
                        return baseQuery;
                    },
                };
            },
            async album({ q }) {
                strict_1.default.equal(q, 'American Football album:"American Football (LP4)"');
                strict_1.default.equal(albumFilter, 'American Football (LP4)');
                return searchResponse;
            },
        },
    };
}
(0, node_test_1.default)('findMatchingDeezerAlbum matches the requested album by title and artist', () => {
    const matchingAlbum = (0, Deezer_1.findMatchingDeezerAlbum)(deezerSearchResponse.data, 'American Football (LP4)', 'American Football');
    strict_1.default.equal(matchingAlbum?.id, 933527471);
});
(0, node_test_1.default)('getDeezerAlbumUrl returns the Deezer album link', () => {
    strict_1.default.equal((0, Deezer_1.getDeezerAlbumUrl)(deezerSearchResponse.data[0]), 'https://www.deezer.com/album/933527471');
});
(0, node_test_1.default)('searchDeezerAlbums builds the album search query', async () => {
    const result = await (0, Deezer_1.searchDeezerAlbums)('American Football (LP4)', 'American Football', createMockDeezerClient(deezerSearchResponse));
    strict_1.default.deepEqual(result, deezerSearchResponse);
});
(0, node_test_1.default)('getDeezerData returns the matched Deezer album URL', async () => {
    const deezerUrl = await (0, Deezer_1.default)('American Football (LP4)', 'American Football', createMockDeezerClient(deezerSearchResponse));
    strict_1.default.equal(deezerUrl, 'https://www.deezer.com/album/933527471');
});
