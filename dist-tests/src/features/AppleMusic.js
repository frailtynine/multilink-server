"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMusicFinder = void 0;
exports.createAppleMusicClient = createAppleMusicClient;
exports.extractAppleMusicAlbums = extractAppleMusicAlbums;
exports.findMatchingAppleMusicAlbum = findMatchingAppleMusicAlbum;
exports.searchAppleMusic = searchAppleMusic;
exports.extractAppleMusicSongs = extractAppleMusicSongs;
exports.findMatchingAppleMusicSong = findMatchingAppleMusicSong;
const applemusic_api_1 = require("@syncfm/applemusic-api");
const albumMatching_1 = require("../utils/albumMatching");
const releaseDate_1 = require("../utils/releaseDate");
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
async function searchAppleMusic(artistName, name, type, client = createAppleMusicClient()) {
    await client.init();
    return client.Search.search({ term: `${artistName} ${name}`, types: [type], limit: 10 });
}
function extractAppleMusicSongs(searchResponse) {
    const songGroup = searchResponse.results?.songs;
    return songGroup?.data ?? [];
}
function findMatchingAppleMusicSong(results, spotifyReleaseDate) {
    if (!spotifyReleaseDate) {
        return results[0];
    }
    const matchingSong = results.find((song) => {
        const releaseDate = song.attributes.releaseDate;
        return releaseDate !== undefined && (0, releaseDate_1.releaseDatesMatch)(spotifyReleaseDate, releaseDate);
    });
    return matchingSong ?? results[0];
}
const AppleMusicFinder = async (name, artistName, releaseDate, client, itemType = 'album') => {
    if (itemType === 'track') {
        const response = await searchAppleMusic(artistName, name, applemusic_api_1.ResourceType.Songs, client);
        const url = findMatchingAppleMusicSong(extractAppleMusicSongs(response), releaseDate)?.attributes.url;
        if (!url) {
            throw new Error('Song not found on Apple Music');
        }
        return url;
    }
    const response = await searchAppleMusic(artistName, name, applemusic_api_1.ResourceType.Albums, client);
    const albums = extractAppleMusicAlbums(response);
    const matchingAlbum = releaseDate
        ? findMatchingAppleMusicAlbum(albums, name, artistName, releaseDate)
        : albums[0];
    const url = matchingAlbum?.attributes.url;
    if (!url) {
        throw new Error('Album not found on Apple Music');
    }
    return url;
};
exports.AppleMusicFinder = AppleMusicFinder;
