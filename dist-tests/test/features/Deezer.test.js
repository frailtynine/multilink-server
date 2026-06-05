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
            async track() {
                throw new Error('not implemented');
            },
        },
    };
}
const deezerTrackSearchResponse = {
    data: [
        {
            id: 111111111,
            title: 'Never Meant',
            link: 'https://www.deezer.com/track/111111111',
            artist: {
                id: 123,
                name: 'American Football',
            },
        },
        {
            id: 222222222,
            title: 'Never Meant',
            link: 'https://www.deezer.com/track/222222222',
            artist: {
                id: 456,
                name: 'Someone Else',
            },
        },
    ],
    total: 2,
};
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
    const deezerUrl = await (0, Deezer_1.default)('American Football (LP4)', 'American Football', 'album', createMockDeezerClient(deezerSearchResponse));
    strict_1.default.equal(deezerUrl, 'https://www.deezer.com/album/933527471');
});
(0, node_test_1.default)('findMatchingDeezerTrack matches the requested track by title and artist', () => {
    const matchingTrack = (0, Deezer_1.findMatchingDeezerTrack)(deezerTrackSearchResponse.data, 'Never Meant', 'American Football');
    strict_1.default.equal(matchingTrack?.id, 111111111);
});
(0, node_test_1.default)('getDeezerTrackUrl returns the Deezer track link', () => {
    strict_1.default.equal((0, Deezer_1.getDeezerTrackUrl)(deezerTrackSearchResponse.data[0]), 'https://www.deezer.com/track/111111111');
});
(0, node_test_1.default)('searchDeezerTracks calls the track search endpoint', async () => {
    let requestedQuery;
    const mockClient = {
        search: {
            builder() {
                return {
                    album() { return this; },
                    build() { return ''; },
                };
            },
            async album() {
                throw new Error('not implemented');
            },
            async track({ q }) {
                requestedQuery = q;
                return deezerTrackSearchResponse;
            },
        },
    };
    const result = await (0, Deezer_1.searchDeezerTracks)('Never Meant', 'American Football', mockClient);
    strict_1.default.equal(requestedQuery, 'American Football Never Meant');
    strict_1.default.deepEqual(result, deezerTrackSearchResponse);
});
(0, node_test_1.default)('getDeezerData with itemType=track returns the matched Deezer track URL', async () => {
    const mockClient = {
        search: {
            builder() {
                return {
                    album() { return this; },
                    build() { return ''; },
                };
            },
            async album() {
                throw new Error('not implemented');
            },
            async track() {
                return deezerTrackSearchResponse;
            },
        },
    };
    const deezerUrl = await (0, Deezer_1.default)('Never Meant', 'American Football', 'track', mockClient);
    strict_1.default.equal(deezerUrl, 'https://www.deezer.com/track/111111111');
});
