import dotenv from "dotenv";
import { Spotifly } from "@manhgdev/spotifyweb";
import { getLogger } from "../logging/logger";
import { releaseDatesMatch } from "../utils/releaseDate";
import {
    SpotifyAlbumData,
    SpotifyAlbumDetails,
    SpotifyAlbumResponse,
    SpotifyClient,
    SpotifySearchAlbumItem,
} from "../types/spotify";

dotenv.config();
const logger = getLogger('spotify');

export function parseSpotifyId(spotifyUrl: string): string {
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

function normalizeText(value: string): string {
    return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function getSpotifyIdFromUri(uri: string): string {
    const spotifyId = uri.split(':').pop();

    if (!spotifyId) {
        throw new Error('Spotify album is missing an id');
    }

    return spotifyId;
}

export function createSpotifyClient(): SpotifyClient {
    return new Spotifly();
}

export function getSpotifyAlbum(spotifyData: SpotifyAlbumResponse): SpotifyAlbumData {
    const spotifyAlbum = spotifyData.data?.albumUnion;

    if (!spotifyAlbum || spotifyAlbum.__typename !== 'Album') {
        throw new Error('Spotify response did not include an album');
    }

    return spotifyAlbum;
}

export function getSpotifyReleaseDate(spotifyAlbum: SpotifyAlbumData): string {
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

function getSpotifyShareUrl(spotifyAlbum: SpotifyAlbumData): string {
    const shareUrl = spotifyAlbum.sharingInfo?.shareUrl;

    if (shareUrl) {
        return shareUrl;
    }

    const spotifyId = getSpotifyIdFromUri(spotifyAlbum.uri);

    return `https://open.spotify.com/album/${spotifyId}`;
}

export function getSpotifyAlbumUrlFromSearchResult(album: SpotifySearchAlbumItem): string {
    return `https://open.spotify.com/album/${getSpotifyIdFromUri(album.data.uri)}`;
}

export function getSpotifyAlbumDetails(spotifyData: SpotifyAlbumResponse): SpotifyAlbumDetails {
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

export function findMatchingSpotifyAlbum(
    albums: SpotifySearchAlbumItem[],
    requestedAlbumName: string,
    requestedArtistName: string,
    requestedReleaseDate?: string,
): SpotifySearchAlbumItem | undefined {
    const normalizedRequestedAlbumName = normalizeText(requestedAlbumName);
    const normalizedRequestedArtistName = normalizeText(requestedArtistName);

    let bestMatch: SpotifySearchAlbumItem | undefined;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const album of albums) {
        const albumData = album.data;
        const normalizedAlbumName = normalizeText(albumData.name);
        const normalizedPrimaryArtistName = normalizeText(albumData.artists.items[0]?.profile.name ?? '');
        let score = 0;

        if (normalizedAlbumName === normalizedRequestedAlbumName) {
            score += 4;
        }

        if (normalizedPrimaryArtistName === normalizedRequestedArtistName) {
            score += 3;
        }

        if (
            requestedReleaseDate &&
            releaseDatesMatch(requestedReleaseDate, `${albumData.date.year}`)
        ) {
            score += 2;
        }

        if (score > bestScore) {
            bestMatch = album;
            bestScore = score;
        }
    }

    return bestMatch;
}

export async function searchSpotifyAlbums(
    albumName: string,
    artistName: string,
    client: SpotifyClient = createSpotifyClient(),
): Promise<SpotifySearchAlbumItem[]> {
    const searchResults = await client.searchAlbums(`${artistName} ${albumName}`, 10);

    return searchResults.data.searchV2.albums.items;
}

export async function findSpotifyAlbumUrl(
    albumName: string,
    artistName: string,
    releaseDate?: string,
    client: SpotifyClient = createSpotifyClient(),
): Promise<string> {
    const albums = await searchSpotifyAlbums(albumName, artistName, client);
    const matchingAlbum = findMatchingSpotifyAlbum(
        albums,
        albumName,
        artistName,
        releaseDate,
    );

    if (!matchingAlbum) {
        throw new Error('Album not found on Spotify');
    }

    return getSpotifyAlbumUrlFromSearchResult(matchingAlbum);
}

export const getSpotifyData = async (
    spotifyUrl: string,
    client: SpotifyClient = createSpotifyClient(),
): Promise<SpotifyAlbumResponse> => {
    const spotifyId = parseSpotifyId(spotifyUrl);

    try {
        return await client.getAlbum(spotifyId);
    } catch (error) {
        logger.error('Failed to fetch Spotify data', { error, spotifyId });
        throw new Error('Failed to fetch Spotify data');
    }
};
