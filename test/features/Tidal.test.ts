import assert from 'node:assert/strict';
import test from 'node:test';
import getTidalUrl, {
    extractTidalAlbums,
    extractTidalTracks,
    findMatchingTidalAlbum,
    findMatchingTidalTrack,
    getTidalAlbumUrl,
    getTidalTrackUrl,
} from '../../src/features/Tidal';
import { TidalSearchResponse } from '../../src/types/tidal';

const tidalSearchResponse: TidalSearchResponse = {
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
            id: 'artist-american-football',
            type: 'artists',
            attributes: {
                name: 'American Football',
            },
        },
        {
            id: '256083091',
            type: 'albums',
            relationships: {
                artists: {
                    data: [
                        {
                            id: 'artist-american-football',
                            type: 'artists',
                        },
                    ],
                },
            },
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
            relationships: {
                artists: {
                    data: [
                        {
                            id: 'artist-american-football',
                            type: 'artists',
                        },
                    ],
                },
            },
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
            relationships: {
                artists: {
                    data: [
                        {
                            id: 'artist-american-football',
                            type: 'artists',
                        },
                    ],
                },
            },
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

test('extractTidalAlbums returns related albums in API order', () => {
    const albums = extractTidalAlbums(tidalSearchResponse);

    assert.deepEqual(albums.map((album) => album.id), ['487367594', '256083091', '256098494']);
    assert.deepEqual(albums[0].artistNames, ['American Football']);
});

test('findMatchingTidalAlbum returns undefined when artist does not match', () => {
    const matchingAlbum = findMatchingTidalAlbum(
        extractTidalAlbums(tidalSearchResponse),
        'American Football (LP4)',
        'Wrong Artist',
        '2026-05-01',
    );

    assert.equal(matchingAlbum, undefined);
});

test('findMatchingTidalAlbum uses fallback included artists when album relationships are absent', () => {
    const matchingAlbum = findMatchingTidalAlbum(
        [
            {
                id: '524824527',
                type: 'albums',
                attributes: {
                    title: 'LOOKING FOR PEOPLE TO UNFOLLOW',
                    releaseDate: '2026-05-22',
                    externalLinks: [
                        {
                            href: 'https://tidal.com/browse/album/524824527',
                            meta: {
                                type: 'TIDAL_SHARING',
                            },
                        },
                    ],
                },
                artistNames: ['Ecca Vandal'],
            },
        ],
        'LOOKING FOR PEOPLE TO UNFOLLOW',
        'Ecca Vandal',
        '2026-05-22',
    );

    assert.equal(matchingAlbum?.id, '524824527');
});

test('findMatchingTidalAlbum matches the requested album by title and release date', () => {
    const matchingAlbum = findMatchingTidalAlbum(
        extractTidalAlbums(tidalSearchResponse),
        'American Football (LP4)',
        'American Football',
        '2026-05-01',
    );

    assert.equal(matchingAlbum?.id, '487367594');
});

test('getTidalAlbumUrl prefers the TIDAL_SHARING external link', () => {
    const matchingAlbum = findMatchingTidalAlbum(
        extractTidalAlbums(tidalSearchResponse),
        'American Football (LP4)',
        'American Football',
        '2026-05-01',
    );

    assert.equal(getTidalAlbumUrl(matchingAlbum!), 'https://tidal.com/browse/album/487367594');
});

test('getTidalUrl authenticates with Tidal and returns the matched album URL', async () => {
    const originalFetch = globalThis.fetch;
    const originalClientId = process.env.TIDAL_CLIENT_ID;
    const originalClientSecret = process.env.TIDAL_CLIENT_SECRET;

    process.env.TIDAL_CLIENT_ID = 'tidal-client-id';
    process.env.TIDAL_CLIENT_SECRET = 'tidal-client-secret';

    try {
        globalThis.fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
            const url = String(input);

            if (url === 'https://auth.tidal.com/v1/oauth2/token') {
                assert.deepEqual(init, {
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

            assert.equal(
                url,
                'https://openapi.tidal.com/v2/searchResults/American%20Football%20American%20Football%20(LP4)?include=albums%2Cartists&countryCode=US&explicitFilter=INCLUDE',
            );
            assert.deepEqual(init, {
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

        assert.equal(
            await getTidalUrl('American Football (LP4)', 'American Football', '2026-05-01'),
            'https://tidal.com/browse/album/487367594',
        );
    } finally {
        globalThis.fetch = originalFetch;

        if (originalClientId === undefined) {
            delete process.env.TIDAL_CLIENT_ID;
        } else {
            process.env.TIDAL_CLIENT_ID = originalClientId;
        }

        if (originalClientSecret === undefined) {
            delete process.env.TIDAL_CLIENT_SECRET;
        } else {
            process.env.TIDAL_CLIENT_SECRET = originalClientSecret;
        }
    }
});

const tidalTrackSearchResponse: TidalSearchResponse = {
    data: {
        relationships: {
            tracks: {
                data: [
                    { id: 'track-100', type: 'tracks' },
                    { id: 'track-200', type: 'tracks' },
                ],
            },
        },
    },
    included: [
        {
            id: 'track-200',
            type: 'tracks',
            attributes: {
                title: 'Never Meant',
                releaseDate: '1999-05-26',
                externalLinks: [
                    {
                        href: 'https://tidal.com/browse/track/track-200',
                        meta: { type: 'TIDAL_SHARING' },
                    },
                ],
            },
        },
        {
            id: 'track-100',
            type: 'tracks',
            attributes: {
                title: 'The Summer Ends',
                releaseDate: '1999-05-26',
                externalLinks: [
                    {
                        href: 'https://tidal.com/browse/track/track-100',
                        meta: { type: 'TIDAL_SHARING' },
                    },
                ],
            },
        },
    ],
};

test('extractTidalTracks returns related tracks in API order', () => {
    assert.deepEqual(
        extractTidalTracks(tidalTrackSearchResponse).map((track) => track.id),
        ['track-100', 'track-200'],
    );
});

test('findMatchingTidalTrack matches the requested track by title', () => {
    const matchingTrack = findMatchingTidalTrack(
        extractTidalTracks(tidalTrackSearchResponse),
        'Never Meant',
    );

    assert.equal(matchingTrack?.id, 'track-200');
});

test('getTidalTrackUrl prefers the TIDAL_SHARING external link', () => {
    const track = extractTidalTracks(tidalTrackSearchResponse).find((t) => t.id === 'track-200');

    assert.equal(getTidalTrackUrl(track!), 'https://tidal.com/browse/track/track-200');
});

test('getTidalUrl with itemType=track authenticates and returns the matched track URL', async () => {
    const originalFetch = globalThis.fetch;
    const originalClientId = process.env.TIDAL_CLIENT_ID;
    const originalClientSecret = process.env.TIDAL_CLIENT_SECRET;

    process.env.TIDAL_CLIENT_ID = 'tidal-client-id';
    process.env.TIDAL_CLIENT_SECRET = 'tidal-client-secret';

    try {
        globalThis.fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
            const url = String(input);

            if (url === 'https://auth.tidal.com/v1/oauth2/token') {
                return new Response(JSON.stringify({ access_token: 'tidal-access-token' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            assert.ok(url.includes('include=tracks'), 'Expected include=tracks in URL');

            return new Response(JSON.stringify(tidalTrackSearchResponse), {
                status: 200,
                headers: { 'Content-Type': 'application/vnd.api+json' },
            });
        };

        assert.equal(
            await getTidalUrl('Never Meant', 'American Football', undefined, 'track'),
            'https://tidal.com/browse/track/track-200',
        );
    } finally {
        globalThis.fetch = originalFetch;

        if (originalClientId === undefined) {
            delete process.env.TIDAL_CLIENT_ID;
        } else {
            process.env.TIDAL_CLIENT_ID = originalClientId;
        }

        if (originalClientSecret === undefined) {
            delete process.env.TIDAL_CLIENT_SECRET;
        } else {
            process.env.TIDAL_CLIENT_SECRET = originalClientSecret;
        }
    }
});
