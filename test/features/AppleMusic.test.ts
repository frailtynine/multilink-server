import assert from 'node:assert/strict';
import test from 'node:test';
import {
    AppleMusicFinder,
    extractAppleMusicAlbums,
    findMatchingAppleMusicAlbum,
    getAppleMusicData,
} from '../../src/features/AppleMusic';
import { AppleMusicAlbumResult, AppleMusicSearchResponse } from '../../src/types/appleMusic';

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
    const matchingAlbum = findMatchingAppleMusicAlbum(appleMusicAlbums, '2026-05-01');

    assert.deepEqual(matchingAlbum, appleMusicAlbums[1]);
});

test('findMatchingAppleMusicAlbum returns the closest album within seven days of the Spotify release date', () => {
    const matchingAlbum = findMatchingAppleMusicAlbum(
        [
            {
                id: 'near',
                type: 'albums',
                href: '/v1/catalog/ru/albums/near',
                attributes: {
                    artistName: 'American Football',
                    name: 'Near',
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
                    name: 'Farther',
                    releaseDate: '2026-05-07',
                    url: 'https://music.apple.com/ru/album/farther',
                },
            },
        ],
        '2026-05-01',
    );

    assert.deepEqual(matchingAlbum, {
        id: 'near',
        type: 'albums',
        href: '/v1/catalog/ru/albums/near',
        attributes: {
            artistName: 'American Football',
            name: 'Near',
            releaseDate: '2026-05-03',
            url: 'https://music.apple.com/ru/album/near',
        },
    });
});

test('findMatchingAppleMusicAlbum does not match albums more than seven days away', () => {
    const matchingAlbum = findMatchingAppleMusicAlbum(appleMusicAlbums, '2026-05-20');

    assert.equal(matchingAlbum, undefined);
});

test('findMatchingAppleMusicAlbum returns undefined when Spotify release date has no day precision', () => {
    const matchingAlbum = findMatchingAppleMusicAlbum(appleMusicAlbums, '2026-05');

    assert.equal(matchingAlbum, undefined);
});

test('getAppleMusicData uses the new album search client', async () => {
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

    const result = await getAppleMusicData('American Football', 'American Football (LP4)', fakeClient);

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
