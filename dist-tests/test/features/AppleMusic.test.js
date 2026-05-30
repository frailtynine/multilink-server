"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const applemusic_api_1 = require("@syncfm/applemusic-api");
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
(0, node_test_1.default)('searchAppleMusic initialises the client and searches with the given resource type', async () => {
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
    const result = await (0, AppleMusic_1.searchAppleMusic)('American Football', 'American Football (LP4)', applemusic_api_1.ResourceType.Albums, fakeClient);
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
const appleMusicSongs = [
    {
        id: 'song-first',
        type: 'songs',
        href: '/v1/catalog/ru/songs/song-first',
        attributes: {
            artistName: 'American Football',
            name: 'Never Meant',
            releaseDate: '1999-05-26',
            url: 'https://music.apple.com/ru/album/never-meant/song-first',
        },
    },
    {
        id: 'song-second',
        type: 'songs',
        href: '/v1/catalog/ru/songs/song-second',
        attributes: {
            artistName: 'American Football',
            name: 'The Summer Ends',
            releaseDate: '1999-05-26',
            url: 'https://music.apple.com/ru/album/the-summer-ends/song-second',
        },
    },
];
const appleMusicSongsSearchResponse = {
    results: {
        songs: {
            href: '/v1/catalog/ru/search?groups=song',
            name: 'Песни',
            groupId: 'song',
            data: appleMusicSongs,
        },
    },
};
(0, node_test_1.default)('extractAppleMusicSongs returns songs from search results', () => {
    strict_1.default.deepEqual((0, AppleMusic_1.extractAppleMusicSongs)(appleMusicSongsSearchResponse), appleMusicSongs);
});
(0, node_test_1.default)('findMatchingAppleMusicSong returns first song when no release date provided', () => {
    const matchingSong = (0, AppleMusic_1.findMatchingAppleMusicSong)(appleMusicSongs);
    strict_1.default.deepEqual(matchingSong, appleMusicSongs[0]);
});
(0, node_test_1.default)('findMatchingAppleMusicSong returns song within seven days of release date', () => {
    const matchingSong = (0, AppleMusic_1.findMatchingAppleMusicSong)(appleMusicSongs, '1999-05-26');
    strict_1.default.deepEqual(matchingSong, appleMusicSongs[0]);
});
(0, node_test_1.default)('searchAppleMusic uses ResourceType.Songs when searching for tracks', async () => {
    let request;
    const fakeClient = {
        async init() { },
        Search: {
            async search(options) {
                request = options;
                return appleMusicSongsSearchResponse;
            },
        },
    };
    const result = await (0, AppleMusic_1.searchAppleMusic)('American Football', 'Never Meant', applemusic_api_1.ResourceType.Songs, fakeClient);
    strict_1.default.deepEqual(request?.types, ['songs']);
    strict_1.default.equal(request?.term, 'American Football Never Meant');
    strict_1.default.deepEqual(result, appleMusicSongsSearchResponse);
});
(0, node_test_1.default)('AppleMusicFinder with itemType=track returns song url from search results', async () => {
    const fakeClient = {
        async init() { },
        Search: {
            async search() {
                return appleMusicSongsSearchResponse;
            },
        },
    };
    strict_1.default.equal(await (0, AppleMusic_1.AppleMusicFinder)('Never Meant', 'American Football', '1999-05-26', fakeClient, 'track'), 'https://music.apple.com/ru/album/never-meant/song-first');
});
