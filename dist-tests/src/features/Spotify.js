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
exports.getSpotifyAlbumUrlFromSearchResult = getSpotifyAlbumUrlFromSearchResult;
exports.getSpotifyAlbumDetails = getSpotifyAlbumDetails;
exports.findMatchingSpotifyAlbum = findMatchingSpotifyAlbum;
exports.searchSpotifyAlbums = searchSpotifyAlbums;
exports.findSpotifyAlbumUrl = findSpotifyAlbumUrl;
const dotenv_1 = __importDefault(require("dotenv"));
const spotifyweb_1 = require("@manhgdev/spotifyweb");
const logger_1 = require("../logging/logger");
const albumMatching_1 = require("../utils/albumMatching");
dotenv_1.default.config();
const logger = (0, logger_1.getLogger)('spotify');
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
function getSpotifyIdFromUri(uri) {
    const spotifyId = uri.split(':').pop();
    if (!spotifyId) {
        throw new Error('Spotify album is missing an id');
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
    const spotifyId = getSpotifyIdFromUri(spotifyAlbum.uri);
    return `https://open.spotify.com/album/${spotifyId}`;
}
function getSpotifyAlbumUrlFromSearchResult(album) {
    return `https://open.spotify.com/album/${getSpotifyIdFromUri(album.data.uri)}`;
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
function findMatchingSpotifyAlbum(albums, requestedAlbumName, requestedArtistName, requestedReleaseDate) {
    return (0, albumMatching_1.findMatchingAlbum)({
        albums,
        requestedAlbumName,
        requestedArtistName,
        requestedReleaseDate,
        getAlbumName: (album) => album.data.name,
        getArtistName: (album) => album.data.artists.items[0]?.profile.name,
        getReleaseDate: (album) => `${album.data.date.year}`,
        requireReleaseDateMatch: true,
        matchesReleaseDate: (requestedDate, candidateYear) => {
            const requestedYear = requestedDate.slice(0, 4);
            return requestedYear.length === 4 && candidateYear === requestedYear;
        },
    });
}
async function searchSpotifyAlbums(albumName, artistName, client = createSpotifyClient()) {
    const searchResults = await client.searchAlbums(`${artistName} ${albumName}`, 10);
    return searchResults.data.searchV2.albums.items;
}
async function findSpotifyAlbumUrl(albumName, artistName, releaseDate, client = createSpotifyClient()) {
    const albums = await searchSpotifyAlbums(albumName, artistName, client);
    const matchingAlbum = findMatchingSpotifyAlbum(albums, albumName, artistName, releaseDate);
    if (!matchingAlbum) {
        throw new Error('Album not found on Spotify');
    }
    console.log('Found matching Spotify album', {
        albumName: matchingAlbum.data.name,
        artistName: matchingAlbum.data.artists.items[0]?.profile.name,
        releaseDate: matchingAlbum.data.date.year,
    });
    return getSpotifyAlbumUrlFromSearchResult(matchingAlbum);
}
const getSpotifyData = async (spotifyUrl, client = createSpotifyClient()) => {
    const spotifyId = parseSpotifyId(spotifyUrl);
    try {
        return await client.getAlbum(spotifyId);
    }
    catch (error) {
        logger.error('Failed to fetch Spotify data', { error, spotifyId });
        throw new Error('Failed to fetch Spotify data');
    }
};
exports.getSpotifyData = getSpotifyData;
