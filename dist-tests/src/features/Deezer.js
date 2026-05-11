"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeezerClient = createDeezerClient;
exports.findMatchingDeezerAlbum = findMatchingDeezerAlbum;
exports.getDeezerAlbumUrl = getDeezerAlbumUrl;
exports.searchDeezerAlbums = searchDeezerAlbums;
const deezer_public_api_1 = require("deezer-public-api");
function createDeezerClient() {
    return new deezer_public_api_1.DeezerPublicApi();
}
function normalizeText(value) {
    return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}
function findMatchingDeezerAlbum(albums, requestedAlbumName, requestedArtistName) {
    const normalizedAlbumName = normalizeText(requestedAlbumName);
    const normalizedArtistName = normalizeText(requestedArtistName);
    const albumMatches = albums.filter((album) => normalizeText(album.title) === normalizedAlbumName);
    const albumCandidates = albumMatches.length > 0 ? albumMatches : albums;
    const artistMatches = albumCandidates.filter((album) => {
        const artistName = album.artist?.name;
        return artistName !== undefined && normalizeText(artistName) === normalizedArtistName;
    });
    return (artistMatches.length > 0 ? artistMatches : albumCandidates)[0];
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
const getDeezerData = async (albumName, artistName, client = createDeezerClient()) => {
    const searchResults = await searchDeezerAlbums(albumName, artistName, client);
    const matchingAlbum = findMatchingDeezerAlbum(searchResults.data, albumName, artistName);
    if (!matchingAlbum) {
        throw new Error('Album not found on Deezer');
    }
    return getDeezerAlbumUrl(matchingAlbum);
};
exports.default = getDeezerData;
