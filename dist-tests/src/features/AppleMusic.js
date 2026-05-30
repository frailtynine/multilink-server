"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppleMusicData = exports.AppleMusicFinder = void 0;
exports.createAppleMusicClient = createAppleMusicClient;
exports.extractAppleMusicAlbums = extractAppleMusicAlbums;
exports.findMatchingAppleMusicAlbum = findMatchingAppleMusicAlbum;
const applemusic_api_1 = require("@syncfm/applemusic-api");
const albumMatching_1 = require("../utils/albumMatching");
function resolveAppleMusicRegion() {
    const configuredRegion = process.env.APPLE_MUSIC_REGION?.toLowerCase();
    const supportedRegions = new Set(Object.values(applemusic_api_1.Region));
    if (configuredRegion && supportedRegions.has(configuredRegion)) {
        return configuredRegion;
    }
    return applemusic_api_1.Region.US;
}
function createAppleMusicClient() {
    return new applemusic_api_1.AppleMusic({
        region: resolveAppleMusicRegion(),
        authType: applemusic_api_1.AuthType.Scraped,
    });
}
function extractAppleMusicAlbums(searchResponse) {
    const albumGroup = searchResponse.results?.albums;
    return albumGroup?.data ?? [];
}
function findMatchingAppleMusicAlbum(results, requestedAlbumName, requestedArtistName, spotifyReleaseDate) {
    return (0, albumMatching_1.findMatchingAlbum)({
        albums: results,
        requestedAlbumName,
        requestedArtistName,
        requestedReleaseDate: spotifyReleaseDate,
        getAlbumName: (album) => album.attributes.name,
        getArtistName: (album) => album.attributes.artistName,
        getReleaseDate: (album) => album.attributes.releaseDate,
        requireReleaseDateMatch: true,
    });
}
const getAppleMusicData = async (artistName, albumName, client = createAppleMusicClient()) => {
    await client.init();
    return client.Search.search({
        term: `${artistName} ${albumName}`,
        types: [applemusic_api_1.ResourceType.Albums],
        limit: 10,
    });
};
exports.getAppleMusicData = getAppleMusicData;
const AppleMusicFinder = async (albumName, artistName, spotifyReleaseDate, client) => {
    const searchResults = await getAppleMusicData(artistName, albumName, client);
    const albums = extractAppleMusicAlbums(searchResults);
    const matchingAlbum = spotifyReleaseDate
        ? findMatchingAppleMusicAlbum(albums, albumName, artistName, spotifyReleaseDate)
        : albums[0];
    if (!matchingAlbum) {
        throw new Error('Album not found on Apple Music');
    }
    const appleMusicUrl = matchingAlbum.attributes.url;
    if (!appleMusicUrl) {
        throw new Error('Album not found on Apple Music');
    }
    return appleMusicUrl;
};
exports.AppleMusicFinder = AppleMusicFinder;
