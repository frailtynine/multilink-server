"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const Spotify_1 = require("../../src/features/Spotify");
const spotifyAlbumResponse = {
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
const spotifySearchAlbumsResponse = {
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
(0, node_test_1.default)('parseSpotifyId returns the spotify id from an album URL', () => {
    const spotifyId = (0, Spotify_1.parseSpotifyId)('https://open.spotify.com/album/2up3OPMp9Tb4dAKM2erWXQ?si=example');
    strict_1.default.equal(spotifyId, '2up3OPMp9Tb4dAKM2erWXQ');
});
(0, node_test_1.default)('parseSpotifyId supports URLs with a trailing slash', () => {
    const spotifyId = (0, Spotify_1.parseSpotifyId)('https://open.spotify.com/album/2up3OPMp9Tb4dAKM2erWXQ/');
    strict_1.default.equal(spotifyId, '2up3OPMp9Tb4dAKM2erWXQ');
});
(0, node_test_1.default)('parseSpotifyId rejects non-Spotify URLs', () => {
    strict_1.default.throws(() => (0, Spotify_1.parseSpotifyId)('https://example.com/album/2up3OPMp9Tb4dAKM2erWXQ'), {
        message: 'Invalid Spotify URL',
    });
});
(0, node_test_1.default)('parseSpotifyId rejects Spotify URLs that are not album URLs', () => {
    strict_1.default.throws(() => (0, Spotify_1.parseSpotifyId)('https://open.spotify.com/track/2up3OPMp9Tb4dAKM2erWXQ'), {
        message: 'Invalid Spotify URL',
    });
});
(0, node_test_1.default)('getSpotifyData uses the parsed album id with the new Spotify client', async () => {
    let requestedSpotifyId;
    const spotifyClient = {
        async getAlbum(id) {
            requestedSpotifyId = id;
            return spotifyAlbumResponse;
        },
        async searchAlbums() {
            throw new Error('not implemented');
        },
    };
    const result = await (0, Spotify_1.getSpotifyData)('https://open.spotify.com/album/2pvLN2jTZhYg9aWQyESDps?si=example', spotifyClient);
    strict_1.default.equal(requestedSpotifyId, '2pvLN2jTZhYg9aWQyESDps');
    strict_1.default.deepEqual(result, spotifyAlbumResponse);
});
(0, node_test_1.default)('getSpotifyAlbum returns the album from albumUnion', () => {
    strict_1.default.deepEqual((0, Spotify_1.getSpotifyAlbum)(spotifyAlbumResponse), spotifyAlbumResponse.data?.albumUnion);
});
(0, node_test_1.default)('getSpotifyAlbumDetails extracts the fields used by the app from the new Spotify response', () => {
    strict_1.default.deepEqual((0, Spotify_1.getSpotifyAlbumDetails)(spotifyAlbumResponse), {
        spotifyUrl: 'https://open.spotify.com/album/2pvLN2jTZhYg9aWQyESDps',
        albumName: 'Feeling Is Structure',
        artistName: 'Kangding Ray, Sigha',
        primaryArtistName: 'Kangding Ray',
        imageUrl: 'https://i.scdn.co/image/ab67616d0000b273example',
        releaseDate: '2026-05-08',
    });
});
(0, node_test_1.default)('getSpotifyReleaseDate preserves month precision', () => {
    const spotifyAlbum = (0, Spotify_1.getSpotifyAlbum)({
        data: {
            albumUnion: {
                ...spotifyAlbumResponse.data.albumUnion,
                date: {
                    isoString: '2026-05',
                    precision: 'MONTH',
                },
            },
        },
    });
    strict_1.default.equal((0, Spotify_1.getSpotifyReleaseDate)(spotifyAlbum), '2026-05');
});
(0, node_test_1.default)('getSpotifyAlbum falls back to a canonical URL when shareUrl is missing', () => {
    strict_1.default.equal((0, Spotify_1.getSpotifyAlbumDetails)({
        data: {
            albumUnion: {
                ...spotifyAlbumResponse.data.albumUnion,
                sharingInfo: {},
            },
        },
    }).spotifyUrl, 'https://open.spotify.com/album/2pvLN2jTZhYg9aWQyESDps');
});
(0, node_test_1.default)('findMatchingSpotifyAlbum prefers the result with matching album, artist, and year', () => {
    const matchingAlbum = (0, Spotify_1.findMatchingSpotifyAlbum)(spotifySearchAlbumsResponse.data.searchV2.albums.items, 'Graceful', 'Touch Girl Apple Blossom', '2026-05-15');
    strict_1.default.deepEqual(matchingAlbum, spotifySearchAlbumsResponse.data.searchV2.albums.items[0]);
});
(0, node_test_1.default)('findSpotifyAlbumUrl returns a canonical album URL from search results', async () => {
    let requestedTerms;
    let requestedLimit;
    const spotifyClient = {
        async getAlbum() {
            throw new Error('not implemented');
        },
        async searchAlbums(terms, limit) {
            requestedTerms = terms;
            requestedLimit = limit;
            return spotifySearchAlbumsResponse;
        },
    };
    const spotifyUrl = await (0, Spotify_1.findSpotifyAlbumUrl)('Graceful', 'Touch Girl Apple Blossom', '2026-05-15', spotifyClient);
    strict_1.default.equal(requestedTerms, 'Touch Girl Apple Blossom Graceful');
    strict_1.default.equal(requestedLimit, 10);
    strict_1.default.equal(spotifyUrl, 'https://open.spotify.com/album/first-match');
});
