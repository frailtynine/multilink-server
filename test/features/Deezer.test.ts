import assert from 'node:assert/strict';
import test from 'node:test';
import getDeezerData, {
    findMatchingDeezerAlbum,
    getDeezerAlbumUrl,
    searchDeezerAlbums,
} from '../../src/features/Deezer';
import { DeezerClient, DeezerSearchResponse } from '../../src/types/deezer';

const deezerSearchResponse: DeezerSearchResponse = {
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

function createMockDeezerClient(searchResponse: DeezerSearchResponse): DeezerClient {
    let albumFilter = '';

    return {
        search: {
            builder(query?: string) {
                let baseQuery = query ?? '';

                return {
                    album(title: string) {
                        albumFilter = title;
                        baseQuery = `${baseQuery} album:"${title}"`;

                        return this;
                    },
                    build() {
                        return baseQuery;
                    },
                };
            },
            async album({ q }: { q: string }): Promise<DeezerSearchResponse> {
                assert.equal(q, 'American Football album:"American Football (LP4)"');
                assert.equal(albumFilter, 'American Football (LP4)');

                return searchResponse;
            },
        },
    };
}

test('findMatchingDeezerAlbum matches the requested album by title and artist', () => {
    const matchingAlbum = findMatchingDeezerAlbum(
        deezerSearchResponse.data,
        'American Football (LP4)',
        'American Football',
    );

    assert.equal(matchingAlbum?.id, 933527471);
});

test('getDeezerAlbumUrl returns the Deezer album link', () => {
    assert.equal(
        getDeezerAlbumUrl(deezerSearchResponse.data[0]),
        'https://www.deezer.com/album/933527471',
    );
});

test('searchDeezerAlbums builds the album search query', async () => {
    const result = await searchDeezerAlbums(
        'American Football (LP4)',
        'American Football',
        createMockDeezerClient(deezerSearchResponse),
    );

    assert.deepEqual(result, deezerSearchResponse);
});

test('getDeezerData returns the matched Deezer album URL', async () => {
    const deezerUrl = await getDeezerData(
        'American Football (LP4)',
        'American Football',
        createMockDeezerClient(deezerSearchResponse),
    );

    assert.equal(deezerUrl, 'https://www.deezer.com/album/933527471');
});
