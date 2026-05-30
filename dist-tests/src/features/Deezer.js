"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeezerClient = createDeezerClient;
exports.findMatchingDeezerAlbum = findMatchingDeezerAlbum;
exports.getDeezerAlbumUrl = getDeezerAlbumUrl;
exports.searchDeezerAlbums = searchDeezerAlbums;
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
const getDeezerData = async (albumName, artistName, client = createDeezerClient()) => {
    const searchResults = await searchDeezerAlbums(albumName, artistName, client);
    const matchingAlbum = findMatchingDeezerAlbum(searchResults.data, albumName, artistName);
    if (!matchingAlbum) {
        throw new Error('Album not found on Deezer');
    }
    return getDeezerAlbumUrl(matchingAlbum);
};
exports.default = getDeezerData;
