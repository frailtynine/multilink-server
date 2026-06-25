import assert from 'node:assert/strict';
import test from 'node:test';
import {
    AppleMusicFinder,
    ResourceType,
    extractAppleMusicAlbums,
    extractAppleMusicSongs,
    findMatchingAppleMusicAlbum,
    findMatchingAppleMusicSong,
    searchAppleMusic,
} from '../../src/features/AppleMusic/AppleMusic';
import { AppleMusicAlbumResult, AppleMusicSearchResponse, AppleMusicSongResult } from '../../src/types/appleMusic';

const appleMusicAlbums: AppleMusicAlbumResult[] = [
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

const appleMusicSearchResponse: AppleMusicSearchResponse = {
    results: {
        albums: {
            href: '/v1/catalog/ru/search?groups=album',
            name: 'Альбомы',
            groupId: 'album',
            data: appleMusicAlbums,
        },
    },
};

test('extractAppleMusicAlbums returns albums from searchResults', () => {
    assert.deepEqual(extractAppleMusicAlbums(appleMusicSearchResponse), appleMusicAlbums);
});

test('findMatchingAppleMusicAlbum returns the album with the matching Spotify release date', () => {
    const matchingAlbum = findMatchingAppleMusicAlbum(
        appleMusicAlbums,
        'American Football (LP4)',
        'American Football',
        '2026-05-01',
    );

    assert.deepEqual(matchingAlbum, appleMusicAlbums[1]);
});

test('findMatchingAppleMusicAlbum matches within seven days of requested release date', () => {
    const matchingAlbum = findMatchingAppleMusicAlbum(
        [
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
        ],
        'American Football (LP4)',
        'American Football',
        '2026-05-01',
    );

    assert.deepEqual(matchingAlbum, {
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

test('findMatchingAppleMusicAlbum does not match albums more than seven days away', () => {
    const matchingAlbum = findMatchingAppleMusicAlbum(
        appleMusicAlbums,
        'American Football (LP4)',
        'American Football',
        '2026-05-20',
    );

    assert.equal(matchingAlbum, undefined);
});

test('findMatchingAppleMusicAlbum matches by release date prefix for month precision', () => {
    const matchingAlbum = findMatchingAppleMusicAlbum(
        appleMusicAlbums,
        'American Football (LP4)',
        'American Football',
        '2026-05',
    );

    assert.deepEqual(matchingAlbum, appleMusicAlbums[1]);
});

test('searchAppleMusic initialises the client and searches with the given resource type', async () => {
    let initialized = false;
    let request:
        | {
            term: string;
            types: unknown[];
            limit: number;
        }
        | undefined;

    const fakeClient = {
        async init() {
            initialized = true;
        },
        Search: {
            async search(options: { term: string; types: unknown[]; limit: number }) {
                request = options;

                return appleMusicSearchResponse;
            },
        },
    };

    const result = await searchAppleMusic('American Football', 'American Football (LP4)', ResourceType.Albums, fakeClient);

    assert.equal(initialized, true);
    assert.deepEqual(request, {
        term: 'American Football American Football (LP4)',
        types: ['albums'],
        limit: 10,
    });
    assert.deepEqual(result, appleMusicSearchResponse);
});

test('AppleMusicFinder returns the matched album url from search results', async () => {
    const fakeClient = {
        async init() {},
        Search: {
            async search() {
                return appleMusicSearchResponse;
            },
        },
    };

    assert.equal(
        await AppleMusicFinder('American Football (LP4)', 'American Football', '2026-05-01', fakeClient),
        'https://music.apple.com/ru/album/american-football-lp4/second',
    );
});

const appleMusicSongs: AppleMusicSongResult[] = [
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

const appleMusicSongsSearchResponse: AppleMusicSearchResponse = {
    results: {
        songs: {
            href: '/v1/catalog/ru/search?groups=song',
            name: 'Песни',
            groupId: 'song',
            data: appleMusicSongs,
        },
    },
};

test('extractAppleMusicSongs returns songs from search results', () => {
    assert.deepEqual(extractAppleMusicSongs(appleMusicSongsSearchResponse), appleMusicSongs);
});

test('findMatchingAppleMusicSong returns first song when no release date provided', () => {
    const matchingSong = findMatchingAppleMusicSong(appleMusicSongs);

    assert.deepEqual(matchingSong, appleMusicSongs[0]);
});

test('findMatchingAppleMusicSong returns song within seven days of release date', () => {
    const matchingSong = findMatchingAppleMusicSong(appleMusicSongs, '1999-05-26');

    assert.deepEqual(matchingSong, appleMusicSongs[0]);
});

test('searchAppleMusic uses ResourceType.Songs when searching for tracks', async () => {
    let request: { term: string; types: unknown[]; limit: number } | undefined;
    const fakeClient = {
        async init() {},
        Search: {
            async search(options: { term: string; types: unknown[]; limit: number }) {
                request = options;

                return appleMusicSongsSearchResponse;
            },
        },
    };

    const result = await searchAppleMusic('American Football', 'Never Meant', ResourceType.Songs, fakeClient);

    assert.deepEqual(request?.types, ['songs']);
    assert.equal(request?.term, 'American Football Never Meant');
    assert.deepEqual(result, appleMusicSongsSearchResponse);
});

test('AppleMusicFinder with itemType=track returns song url from search results', async () => {
    const fakeClient = {
        async init() {},
        Search: {
            async search() {
                return appleMusicSongsSearchResponse;
            },
        },
    };

    assert.equal(
        await AppleMusicFinder('Never Meant', 'American Football', '1999-05-26', fakeClient, 'track'),
        'https://music.apple.com/ru/album/never-meant/song-first',
    );
});
