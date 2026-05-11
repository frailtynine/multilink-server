import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getSpotifyAlbum,
    getSpotifyAlbumDetails,
    getSpotifyData,
    getSpotifyReleaseDate,
    parseSpotifyId,
} from '../../src/features/Spotify';
import { SpotifyAlbumResponse, SpotifyClient } from '../../src/types/spotify';

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
