import assert from 'node:assert/strict';
import test from 'node:test';
import getDeezerData, {
    findMatchingDeezerAlbum,
    findMatchingDeezerTrack,
    getDeezerAlbumUrl,
    getDeezerTrackUrl,
    searchDeezerAlbums,
    searchDeezerTracks,
} from '../../src/features/Deezer';
import { DeezerClient, DeezerSearchResponse, DeezerTrack, DeezerTrackSearchResponse } from '../../src/types/deezer';

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
            async track(): Promise<DeezerTrackSearchResponse> {
                throw new Error('not implemented');
            },
        },
    };
}

const deezerTrackSearchResponse: DeezerTrackSearchResponse = {
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
        'album',
        createMockDeezerClient(deezerSearchResponse),
    );

    assert.equal(deezerUrl, 'https://www.deezer.com/album/933527471');
});

test('findMatchingDeezerTrack matches the requested track by title and artist', () => {
    const matchingTrack = findMatchingDeezerTrack(
        deezerTrackSearchResponse.data,
        'Never Meant',
        'American Football',
    );

    assert.equal(matchingTrack?.id, 111111111);
});

test('getDeezerTrackUrl returns the Deezer track link', () => {
    assert.equal(
        getDeezerTrackUrl(deezerTrackSearchResponse.data[0]),
        'https://www.deezer.com/track/111111111',
    );
});

test('searchDeezerTracks calls the track search endpoint', async () => {
    let requestedQuery: string | undefined;
    const mockClient: DeezerClient = {
        search: {
            builder() {
                return {
                    album() { return this; },
                    build() { return ''; },
                };
            },
            async album(): Promise<DeezerSearchResponse> {
                throw new Error('not implemented');
            },
            async track({ q }: { q: string }): Promise<DeezerTrackSearchResponse> {
                requestedQuery = q;

                return deezerTrackSearchResponse;
            },
        },
    };

    const result = await searchDeezerTracks('Never Meant', 'American Football', mockClient);

    assert.equal(requestedQuery, 'American Football Never Meant');
    assert.deepEqual(result, deezerTrackSearchResponse);
});

test('getDeezerData with itemType=track returns the matched Deezer track URL', async () => {
    const mockClient: DeezerClient = {
        search: {
            builder() {
                return {
                    album() { return this; },
                    build() { return ''; },
                };
            },
            async album(): Promise<DeezerSearchResponse> {
                throw new Error('not implemented');
            },
            async track(): Promise<DeezerTrackSearchResponse> {
                return deezerTrackSearchResponse;
            },
        },
    };

    const deezerUrl = await getDeezerData(
        'Never Meant',
        'American Football',
        'track',
        mockClient,
    );

    assert.equal(deezerUrl, 'https://www.deezer.com/track/111111111');
});
