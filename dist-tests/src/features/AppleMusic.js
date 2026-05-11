"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppleMusicData = exports.AppleMusicFinder = void 0;
exports.createAppleMusicClient = createAppleMusicClient;
exports.extractAppleMusicAlbums = extractAppleMusicAlbums;
exports.findMatchingAppleMusicAlbum = findMatchingAppleMusicAlbum;
const applemusic_api_1 = require("@syncfm/applemusic-api");
const SEVEN_DAYS_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;
function createAppleMusicClient() {
    return new applemusic_api_1.AppleMusic({
        region: applemusic_api_1.Region.RU,
        authType: applemusic_api_1.AuthType.Scraped,
    });
}
function parseSpotifyReleaseDate(spotifyReleaseDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(spotifyReleaseDate)) {
        return undefined;
    }
    const timestamp = Date.parse(`${spotifyReleaseDate}T00:00:00Z`);
    return Number.isNaN(timestamp) ? undefined : timestamp;
}
function extractAppleMusicAlbums(searchResponse) {
    const albumGroup = searchResponse.results?.albums;
    return albumGroup?.data ?? [];
}
function findMatchingAppleMusicAlbum(results, spotifyReleaseDate) {
    const spotifyReleaseTimestamp = parseSpotifyReleaseDate(spotifyReleaseDate);
    if (spotifyReleaseTimestamp === undefined) {
        return undefined;
    }
    let bestMatch;
    let bestDifference = Number.POSITIVE_INFINITY;
    for (const result of results) {
        const releaseDate = result.attributes.releaseDate;
        if (!releaseDate) {
            continue;
        }
        const appleMusicReleaseTimestamp = Date.parse(releaseDate);
        if (Number.isNaN(appleMusicReleaseTimestamp)) {
            continue;
        }
        const difference = Math.abs(appleMusicReleaseTimestamp - spotifyReleaseTimestamp);
        if (difference <= SEVEN_DAYS_IN_MILLISECONDS && difference < bestDifference) {
            bestMatch = result;
            bestDifference = difference;
        }
    }
    return bestMatch;
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
        ? findMatchingAppleMusicAlbum(albums, spotifyReleaseDate)
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
