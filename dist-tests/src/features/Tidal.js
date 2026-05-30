"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTidalAlbumUrl = getTidalAlbumUrl;
exports.extractTidalAlbums = extractTidalAlbums;
exports.findMatchingTidalAlbum = findMatchingTidalAlbum;
const releaseDate_1 = require("../utils/releaseDate");
const albumMatching_1 = require("../utils/albumMatching");
function getTidalCredentials() {
    const clientId = process.env.TIDAL_CLIENT_ID;
    const clientSecret = process.env.TIDAL_CLIENT_SECRET;
    if (!clientId) {
        throw new Error('TIDAL_CLIENT_ID is not set in environment variables');
    }
    if (!clientSecret) {
        throw new Error('TIDAL_CLIENT_SECRET is not set in environment variables');
    }
    return { clientId, clientSecret };
}
async function getAccessToken() {
    const { clientId, clientSecret } = getTidalCredentials();
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://auth.tidal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
        }),
    });
    if (!response.ok) {
        throw new Error(`Tidal auth failed: ${response.status}`);
    }
    const payload = await response.json();
    if (!payload.access_token) {
        throw new Error('Tidal auth response did not include an access token');
    }
    return payload.access_token;
}
function isAlbum(result) {
    return result.type === 'albums';
}
function isArtist(result) {
    return result.type === 'artists';
}
function getTidalAlbumUrl(album) {
    const externalLinks = album.attributes?.externalLinks ?? [];
    const tidalSharingLink = externalLinks.find((link) => link.meta?.type === 'TIDAL_SHARING');
    return tidalSharingLink?.href ?? externalLinks[0]?.href;
}
function mapTidalCandidates(searchResponse) {
    const includedResources = searchResponse.included ?? [];
    const includedAlbums = includedResources.filter(isAlbum);
    const artistsById = new Map(includedResources
        .filter(isArtist)
        .map((artist) => [artist.id, artist.attributes?.name]));
    const fallbackArtistNames = Array.from(artistsById.values()).filter((artistName) => Boolean(artistName));
    const orderedAlbumIds = (searchResponse.data?.relationships?.albums?.data ?? [])
        .filter((relationship) => relationship.type === 'albums')
        .map((relationship) => relationship.id);
    const albumsToMap = orderedAlbumIds.length > 0
        ? orderedAlbumIds
            .map((albumId) => includedAlbums.find((album) => album.id === albumId))
            .filter((album) => album !== undefined)
        : includedAlbums;
    return albumsToMap.map((album) => {
        const relatedArtistIds = album.relationships?.artists?.data
            ?.filter((relationship) => relationship.type === 'artists')
            .map((relationship) => relationship.id) ?? [];
        const relationshipArtistNames = relatedArtistIds
            .map((artistId) => artistsById.get(artistId))
            .filter((artistName) => Boolean(artistName));
        const artistNames = relationshipArtistNames.length > 0
            ? relationshipArtistNames
            : fallbackArtistNames;
        return {
            album: {
                ...album,
                artistNames,
            },
            albumName: album.attributes?.title ?? '',
            artistNames,
            releaseDate: album.attributes?.releaseDate,
            url: getTidalAlbumUrl(album),
        };
    });
}
function extractTidalAlbums(searchResponse) {
    return mapTidalCandidates(searchResponse).map((candidate) => candidate.album);
}
function findMatchingTidalAlbum(albums, requestedAlbumName, requestedArtistName, spotifyReleaseDate) {
    const matchingAlbum = (0, albumMatching_1.findMatchingAlbum)({
        albums,
        requestedAlbumName,
        requestedArtistName,
        requestedReleaseDate: spotifyReleaseDate,
        getAlbumName: (album) => album.attributes?.title,
        getArtistName: (album) => album.artistNames?.join(', '),
        getReleaseDate: (album) => album.attributes?.releaseDate,
        matchesReleaseDate: releaseDate_1.releaseDatesMatch,
        requireReleaseDateMatch: true,
    });
    return matchingAlbum;
}
async function searchTidalCandidates(accessToken, albumName, artistName) {
    const query = `${artistName} ${albumName}`;
    const searchUrl = new URL(`https://openapi.tidal.com/v2/searchResults/${encodeURIComponent(query)}`);
    searchUrl.searchParams.set('include', 'albums,artists');
    searchUrl.searchParams.set('countryCode', 'US');
    searchUrl.searchParams.set('explicitFilter', 'INCLUDE');
    const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.api+json',
        },
    });
    if (!response.ok) {
        throw new Error(`Tidal search failed: ${response.status}`);
    }
    const payload = await response.json();
    return mapTidalCandidates(payload);
}
async function getTidalUrl(albumName, artistName, spotifyReleaseDate) {
    const accessToken = await getAccessToken();
    const candidates = await searchTidalCandidates(accessToken, albumName, artistName);
    const matchingCandidate = (0, albumMatching_1.findMatchingAlbum)({
        albums: candidates,
        requestedAlbumName: albumName,
        requestedArtistName: artistName,
        requestedReleaseDate: spotifyReleaseDate,
        getAlbumName: (candidate) => candidate.albumName,
        getArtistName: (candidate) => candidate.artistNames.join(', '),
        getReleaseDate: (candidate) => candidate.releaseDate,
        matchesReleaseDate: releaseDate_1.releaseDatesMatch,
        requireReleaseDateMatch: true,
    });
    const tidalUrl = matchingCandidate?.url;
    if (!tidalUrl) {
        throw new Error('Album not found on Tidal');
    }
    return tidalUrl;
}
exports.default = getTidalUrl;
