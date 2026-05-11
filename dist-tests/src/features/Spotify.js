"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpotifyData = void 0;
exports.parseSpotifyId = parseSpotifyId;
exports.createSpotifyClient = createSpotifyClient;
exports.getSpotifyAlbum = getSpotifyAlbum;
exports.getSpotifyReleaseDate = getSpotifyReleaseDate;
exports.getSpotifyAlbumDetails = getSpotifyAlbumDetails;
const dotenv_1 = __importDefault(require("dotenv"));
const spotifyweb_1 = require("@manhgdev/spotifyweb");
dotenv_1.default.config();
function parseSpotifyId(spotifyUrl) {
    const { hostname, pathname } = new URL(spotifyUrl);
    if (hostname !== 'open.spotify.com') {
        throw new Error('Invalid Spotify URL');
    }
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments[0] !== 'album') {
        throw new Error('Invalid Spotify URL');
    }
    const spotifyId = pathSegments[1];
    if (!spotifyId) {
        throw new Error('Invalid Spotify URL');
    }
    return spotifyId;
}
function createSpotifyClient() {
    return new spotifyweb_1.Spotifly();
}
function getSpotifyAlbum(spotifyData) {
    const spotifyAlbum = spotifyData.data?.albumUnion;
    if (!spotifyAlbum || spotifyAlbum.__typename !== 'Album') {
        throw new Error('Spotify response did not include an album');
    }
    return spotifyAlbum;
}
function getSpotifyReleaseDate(spotifyAlbum) {
    const { isoString, precision } = spotifyAlbum.date;
    switch (precision.toUpperCase()) {
        case 'DAY':
            return isoString.slice(0, 10);
        case 'MONTH':
            return isoString.slice(0, 7);
        case 'YEAR':
            return isoString.slice(0, 4);
        default:
            return isoString;
    }
}
function getSpotifyShareUrl(spotifyAlbum) {
    const shareUrl = spotifyAlbum.sharingInfo?.shareUrl;
    if (shareUrl) {
        return shareUrl;
    }
    const spotifyId = spotifyAlbum.uri.split(':').pop();
    if (!spotifyId) {
        throw new Error('Spotify album is missing a share URL');
    }
    return `https://open.spotify.com/album/${spotifyId}`;
}
function getSpotifyAlbumDetails(spotifyData) {
    const spotifyAlbum = getSpotifyAlbum(spotifyData);
    const artistNames = spotifyAlbum.artists.items
        .map((artist) => artist.profile.name)
        .filter((name) => name.length > 0);
    const primaryArtistName = artistNames[0];
    if (!primaryArtistName) {
        throw new Error('Spotify album is missing artists');
    }
    return {
        spotifyUrl: getSpotifyShareUrl(spotifyAlbum),
        albumName: spotifyAlbum.name,
        artistName: artistNames.join(', '),
        primaryArtistName,
        imageUrl: spotifyAlbum.coverArt.sources[0]?.url ?? '',
        releaseDate: getSpotifyReleaseDate(spotifyAlbum),
    };
}
const getSpotifyData = async (spotifyUrl, client = createSpotifyClient()) => {
    const spotifyId = parseSpotifyId(spotifyUrl);
    try {
        return await client.getAlbum(spotifyId);
    }
    catch (error) {
        console.error('Error fetching Spotify data:', error);
        throw new Error('Failed to fetch Spotify data');
    }
};
exports.getSpotifyData = getSpotifyData;
