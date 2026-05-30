"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const AppleMusic_1 = require("../../src/features/AppleMusic");
const appleMusicAlbums = [
    {
        id: 'first',
        type: 'albums',
        href: '/v1/catalog/ru/albums/first',
        attributes: {
            artistName: 'American Football',
            name: 'American Football (Lp3)',
            releaseDate: '2019-03-22',
            url: 'https://music.apple.com/ru/album/american-football-lp3/first',
        },
    },
    {
        id: 'second',
        type: 'albums',
        href: '/v1/catalog/ru/albums/second',
        attributes: {
            artistName: 'American Football',
            name: 'American Football (Lp4)',
            releaseDate: '2026-05-01',
            url: 'https://music.apple.com/ru/album/american-football-lp4/second',
        },
    },
];
const appleMusicSearchResponse = {
    results: {
        albums: {
            href: '/v1/catalog/ru/search?groups=album',
            name: 'Альбомы',
            groupId: 'album',
            data: appleMusicAlbums,
        },
    },
};
(0, node_test_1.default)('extractAppleMusicAlbums returns albums from searchResults', () => {
    strict_1.default.deepEqual((0, AppleMusic_1.extractAppleMusicAlbums)(appleMusicSearchResponse), appleMusicAlbums);
});
(0, node_test_1.default)('findMatchingAppleMusicAlbum returns the album with the matching Spotify release date', () => {
    const matchingAlbum = (0, AppleMusic_1.findMatchingAppleMusicAlbum)(appleMusicAlbums, 'American Football (LP4)', 'American Football', '2026-05-01');
    strict_1.default.deepEqual(matchingAlbum, appleMusicAlbums[1]);
});
(0, node_test_1.default)('findMatchingAppleMusicAlbum matches within seven days of requested release date', () => {
    const matchingAlbum = (0, AppleMusic_1.findMatchingAppleMusicAlbum)([
        {
            id: 'near',
            type: 'albums',
            href: '/v1/catalog/ru/albums/near',
            attributes: {
                artistName: 'American Football',
                name: 'American Football (LP4)',
                releaseDate: '2026-05-03',
                url: 'https://music.apple.com/ru/album/near',
            },
        },
        {
            id: 'farther',
            type: 'albums',
            href: '/v1/catalog/ru/albums/farther',
            attributes: {
                artistName: 'American Football',
                name: 'American Football (LP4) Extended',
                releaseDate: '2026-05-07',
                url: 'https://music.apple.com/ru/album/farther',
            },
        },
    ], 'American Football (LP4)', 'American Football', '2026-05-01');
    strict_1.default.deepEqual(matchingAlbum, {
        id: 'near',
        type: 'albums',
        href: '/v1/catalog/ru/albums/near',
        attributes: {
            artistName: 'American Football',
            name: 'American Football (LP4)',
            releaseDate: '2026-05-03',
            url: 'https://music.apple.com/ru/album/near',
        },
    });
});
(0, node_test_1.default)('findMatchingAppleMusicAlbum does not match albums more than seven days away', () => {
    const matchingAlbum = (0, AppleMusic_1.findMatchingAppleMusicAlbum)(appleMusicAlbums, 'American Football (LP4)', 'American Football', '2026-05-20');
    strict_1.default.equal(matchingAlbum, undefined);
});
(0, node_test_1.default)('findMatchingAppleMusicAlbum matches by release date prefix for month precision', () => {
    const matchingAlbum = (0, AppleMusic_1.findMatchingAppleMusicAlbum)(appleMusicAlbums, 'American Football (LP4)', 'American Football', '2026-05');
    strict_1.default.deepEqual(matchingAlbum, appleMusicAlbums[1]);
});
(0, node_test_1.default)('getAppleMusicData uses the new album search client', async () => {
    let initialized = false;
    let request;
    const fakeClient = {
        async init() {
            initialized = true;
        },
        Search: {
            async search(options) {
                request = options;
                return appleMusicSearchResponse;
            },
        },
    };
    const result = await (0, AppleMusic_1.getAppleMusicData)('American Football', 'American Football (LP4)', fakeClient);
    strict_1.default.equal(initialized, true);
    strict_1.default.deepEqual(request, {
        term: 'American Football American Football (LP4)',
        types: ['albums'],
        limit: 10,
    });
    strict_1.default.deepEqual(result, appleMusicSearchResponse);
});
(0, node_test_1.default)('AppleMusicFinder returns the matched album url from search results', async () => {
    const fakeClient = {
        async init() { },
        Search: {
            async search() {
                return appleMusicSearchResponse;
            },
        },
    };
    strict_1.default.equal(await (0, AppleMusic_1.AppleMusicFinder)('American Football (LP4)', 'American Football', '2026-05-01', fakeClient), 'https://music.apple.com/ru/album/american-football-lp4/second');
});
