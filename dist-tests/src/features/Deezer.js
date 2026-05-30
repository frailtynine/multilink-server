"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeezerClient = createDeezerClient;
exports.findMatchingDeezerAlbum = findMatchingDeezerAlbum;
exports.getDeezerAlbumUrl = getDeezerAlbumUrl;
exports.searchDeezerAlbums = searchDeezerAlbums;
exports.searchDeezerTracks = searchDeezerTracks;
exports.findMatchingDeezerTrack = findMatchingDeezerTrack;
exports.getDeezerTrackUrl = getDeezerTrackUrl;
const deezer_public_api_1 = require("deezer-public-api");
const albumMatching_1 = require("../utils/albumMatching");
function createDeezerClient() {
    return new deezer_public_api_1.DeezerPublicApi();
}
function findMatchingDeezerAlbum(albums, requestedAlbumName, requestedArtistName) {
    return (0, albumMatching_1.findMatchingAlbum)({
        albums,
        requestedAlbumName,
        requestedArtistName,
        getAlbumName: (album) => album.title,
        getArtistName: (album) => album.artist?.name,
    });
}
function getDeezerAlbumUrl(album) {
    return album.link;
}
async function searchDeezerAlbums(albumName, artistName, client = createDeezerClient()) {
    const query = client.search.builder(artistName)
        .album(albumName)
        .build();
    return client.search.album({ q: query });
}
async function searchDeezerTracks(trackName, artistName, client = createDeezerClient()) {
    return client.search.track({ q: `${artistName} ${trackName}` });
}
function findMatchingDeezerTrack(tracks, requestedTrackName, requestedArtistName) {
    const normalizedTrackName = (0, albumMatching_1.normalizeText)(requestedTrackName);
    const normalizedArtistName = (0, albumMatching_1.normalizeText)(requestedArtistName);
    const titleMatches = tracks.filter((track) => (0, albumMatching_1.normalizeText)(track.title) === normalizedTrackName);
    const titleCandidates = titleMatches.length > 0 ? titleMatches : tracks;
    const artistMatches = titleCandidates.filter((track) => {
        const artistName = track.artist?.name;
        return artistName !== undefined && (0, albumMatching_1.normalizeText)(artistName) === normalizedArtistName;
    });
    return (artistMatches.length > 0 ? artistMatches : titleCandidates)[0];
}
function getDeezerTrackUrl(track) {
    return track.link;
}
const getDeezerData = async (albumName, artistName, itemType = 'album', client = createDeezerClient()) => {
    if (itemType === 'track') {
        const searchResults = await searchDeezerTracks(albumName, artistName, client);
        const matchingTrack = findMatchingDeezerTrack(searchResults.data, albumName, artistName);
        if (!matchingTrack) {
            throw new Error('Track not found on Deezer');
        }
        return getDeezerTrackUrl(matchingTrack);
    }
    const searchResults = await searchDeezerAlbums(albumName, artistName, client);
    const matchingAlbum = findMatchingDeezerAlbum(searchResults.data, albumName, artistName);
    if (!matchingAlbum) {
        throw new Error('Album not found on Deezer');
    }
    return getDeezerAlbumUrl(matchingAlbum);
};
exports.default = getDeezerData;
