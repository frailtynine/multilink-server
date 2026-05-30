import assert from 'node:assert/strict';
import test from 'node:test';
import {
    findMatchingSpotifyAlbum,
    findSpotifyAlbumUrl,
    getSpotifyAlbum,
    getSpotifyAlbumDetails,
    getSpotifyData,
    getSpotifyReleaseDate,
    parseSpotifyId,
} from '../../src/features/Spotify';
import { SpotifyAlbumResponse, SpotifyClient, SpotifySearchAlbumsResponse } from '../../src/types/spotify';

const spotifyAlbumResponse: SpotifyAlbumResponse = {
    data: {
        albumUnion: {
            __typename: 'Album',
            uri: 'spotify:album:2pvLN2jTZhYg9aWQyESDps',
            name: 'Feeling Is Structure',
            artists: {
                items: [
                    {
                        uri: 'spotify:artist:3QvQ41Z3m0bJjZ1bN3hD1x',
                        profile: {
                            name: 'Kangding Ray',
                        },
                    },
                    {
                        uri: 'spotify:artist:4mN3j60DdL8rSYxRZ9uLL9',
                        profile: {
                            name: 'Sigha',
                        },
                    },
                ],
            },
            coverArt: {
                sources: [
                    {
                        url: 'https://i.scdn.co/image/ab67616d0000b273example',
                        width: 640,
                        height: 640,
                    },
                ],
            },
            date: {
                isoString: '2026-05-08T00:00:00Z',
                precision: 'DAY',
            },
            sharingInfo: {
                shareUrl: 'https://open.spotify.com/album/2pvLN2jTZhYg9aWQyESDps',
            },
        },
    },
};

const spotifySearchAlbumsResponse: SpotifySearchAlbumsResponse = {
    data: {
        searchV2: {
            albums: {
                items: [
                    {
                        data: {
                            __typename: 'Album',
                            uri: 'spotify:album:first-match',
                            name: 'Graceful',
                            artists: {
                                items: [
                                    {
                                        uri: 'spotify:artist:artist-1',
                                        profile: {
                                            name: 'Touch Girl Apple Blossom',
                                        },
                                    },
                                ],
                            },
                            coverArt: {
                                sources: [],
                            },
                            date: {
                                year: 2026,
                            },
                        },
                    },
                    {
                        data: {
                            __typename: 'Album',
                            uri: 'spotify:album:wrong-artist',
                            name: 'Graceful',
                            artists: {
                                items: [
                                    {
                                        uri: 'spotify:artist:artist-2',
                                        profile: {
                                            name: 'Someone Else',
                                        },
                                    },
                                ],
                            },
                            coverArt: {
                                sources: [],
                            },
                            date: {
                                year: 2026,
                            },
                        },
                    },
                ],
            },
        },
    },
};

test('parseSpotifyId returns the spotify id from an album URL', () => {
    const spotifyId = parseSpotifyId('https://open.spotify.com/album/2up3OPMp9Tb4dAKM2erWXQ?si=example');

    assert.equal(spotifyId, '2up3OPMp9Tb4dAKM2erWXQ');
});

test('parseSpotifyId supports URLs with a trailing slash', () => {
    const spotifyId = parseSpotifyId('https://open.spotify.com/album/2up3OPMp9Tb4dAKM2erWXQ/');

    assert.equal(spotifyId, '2up3OPMp9Tb4dAKM2erWXQ');
});

test('parseSpotifyId rejects non-Spotify URLs', () => {
    assert.throws(() => parseSpotifyId('https://example.com/album/2up3OPMp9Tb4dAKM2erWXQ'), {
        message: 'Invalid Spotify URL',
    });
});

test('parseSpotifyId rejects Spotify URLs that are not album URLs', () => {
    assert.throws(() => parseSpotifyId('https://open.spotify.com/track/2up3OPMp9Tb4dAKM2erWXQ'), {
        message: 'Invalid Spotify URL',
    });
});

test('getSpotifyData uses the parsed album id with the new Spotify client', async () => {
    let requestedSpotifyId: string | undefined;
    const spotifyClient: SpotifyClient = {
        async getAlbum(id: string): Promise<SpotifyAlbumResponse> {
            requestedSpotifyId = id;

            return spotifyAlbumResponse;
        },
        async searchAlbums(): Promise<SpotifySearchAlbumsResponse> {
            throw new Error('not implemented');
        },
    };

    const result = await getSpotifyData(
        'https://open.spotify.com/album/2pvLN2jTZhYg9aWQyESDps?si=example',
        spotifyClient,
    );

    assert.equal(requestedSpotifyId, '2pvLN2jTZhYg9aWQyESDps');
    assert.deepEqual(result, spotifyAlbumResponse);
});

test('getSpotifyAlbum returns the album from albumUnion', () => {
    assert.deepEqual(getSpotifyAlbum(spotifyAlbumResponse), spotifyAlbumResponse.data?.albumUnion);
});

test('getSpotifyAlbumDetails extracts the fields used by the app from the new Spotify response', () => {
    assert.deepEqual(getSpotifyAlbumDetails(spotifyAlbumResponse), {
        spotifyUrl: 'https://open.spotify.com/album/2pvLN2jTZhYg9aWQyESDps',
        albumName: 'Feeling Is Structure',
        artistName: 'Kangding Ray, Sigha',
        primaryArtistName: 'Kangding Ray',
        imageUrl: 'https://i.scdn.co/image/ab67616d0000b273example',
        releaseDate: '2026-05-08',
    });
});

test('getSpotifyReleaseDate preserves month precision', () => {
    const spotifyAlbum = getSpotifyAlbum({
        data: {
            albumUnion: {
                ...spotifyAlbumResponse.data!.albumUnion!,
                date: {
                    isoString: '2026-05',
                    precision: 'MONTH',
                },
            },
        },
    });

    assert.equal(getSpotifyReleaseDate(spotifyAlbum), '2026-05');
});

test('getSpotifyAlbum falls back to a canonical URL when shareUrl is missing', () => {
    assert.equal(
        getSpotifyAlbumDetails({
            data: {
                albumUnion: {
                    ...spotifyAlbumResponse.data!.albumUnion!,
                    sharingInfo: {},
                },
            },
        }).spotifyUrl,
        'https://open.spotify.com/album/2pvLN2jTZhYg9aWQyESDps',
    );
});

test('findMatchingSpotifyAlbum prefers the result with matching album, artist, and year', () => {
    const matchingAlbum = findMatchingSpotifyAlbum(
        spotifySearchAlbumsResponse.data.searchV2.albums.items,
        'Graceful',
        'Touch Girl Apple Blossom',
        '2026-05-15',
    );

    assert.deepEqual(matchingAlbum, spotifySearchAlbumsResponse.data.searchV2.albums.items[0]);
});

test('findMatchingSpotifyAlbum returns undefined when no candidate matches album or artist', () => {
    const matchingAlbum = findMatchingSpotifyAlbum(
        [
            {
                data: {
                    __typename: 'Album',
                    uri: 'spotify:album:irrelevant',
                    name: 'Absolutely Different',
                    artists: {
                        items: [
                            {
                                uri: 'spotify:artist:irrelevant',
                                profile: {
                                    name: 'Completely Different Artist',
                                },
                            },
                        ],
                    },
                    coverArt: {
                        sources: [],
                    },
                    date: {
                        year: 2026,
                    },
                },
            },
        ],
        'Graceful',
        'Touch Girl Apple Blossom',
        '2026-05-15',
    );

    assert.equal(matchingAlbum, undefined);
});

test('findMatchingSpotifyAlbum returns undefined when only album name matches', () => {
    const matchingAlbum = findMatchingSpotifyAlbum(
        [
            {
                data: {
                    __typename: 'Album',
                    uri: 'spotify:album:album-only-match',
                    name: 'Graceful',
                    artists: {
                        items: [
                            {
                                uri: 'spotify:artist:wrong',
                                profile: {
                                    name: 'Another Artist',
                                },
                            },
                        ],
                    },
                    coverArt: {
                        sources: [],
                    },
                    date: {
                        year: 2030,
                    },
                },
            },
        ],
        'Graceful',
        'Touch Girl Apple Blossom',
        '2026-05-15',
    );

    assert.equal(matchingAlbum, undefined);
});

test('findMatchingSpotifyAlbum matches when album and artist names contain each other', () => {
    const matchingAlbum = findMatchingSpotifyAlbum(
        [
            {
                data: {
                    __typename: 'Album',
                    uri: 'spotify:album:contains-match',
                    name: 'Bottom of the Hill (Deluxe Edition)',
                    artists: {
                        items: [
                            {
                                uri: 'spotify:artist:contains-match',
                                profile: {
                                    name: 'Achers, Guest Vocalist',
                                },
                            },
                        ],
                    },
                    coverArt: {
                        sources: [],
                    },
                    date: {
                        year: 2026,
                    },
                },
            },
        ],
        'Bottom of the Hill',
        'Achers',
        '2026-05-15',
    );

    assert.equal(matchingAlbum?.data.uri, 'spotify:album:contains-match');
});

test('findSpotifyAlbumUrl returns a canonical album URL from search results', async () => {
    let requestedTerms: string | undefined;
    let requestedLimit: number | undefined;
    const spotifyClient: SpotifyClient = {
        async getAlbum(): Promise<SpotifyAlbumResponse> {
            throw new Error('not implemented');
        },
        async searchAlbums(terms: string, limit?: number): Promise<SpotifySearchAlbumsResponse> {
            requestedTerms = terms;
            requestedLimit = limit;

            return spotifySearchAlbumsResponse;
        },
    };

    const spotifyUrl = await findSpotifyAlbumUrl(
        'Graceful',
        'Touch Girl Apple Blossom',
        '2026-05-15',
        spotifyClient,
    );

    assert.equal(requestedTerms, 'Touch Girl Apple Blossom Graceful');
    assert.equal(requestedLimit, 10);
    assert.equal(spotifyUrl, 'https://open.spotify.com/album/first-match');
});
