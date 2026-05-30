import dotenv from "dotenv";
import { Spotifly } from "@manhgdev/spotifyweb";
import { getLogger } from "../logging/logger";
import { findMatchingAlbum, normalizeText } from '../utils/albumMatching';
import {
    SpotifyAlbumData,
    SpotifyAlbumDetails,
    SpotifyAlbumResponse,
    SpotifyClient,
    SpotifySearchAlbumItem,
    SpotifySearchTrackItem,
    SpotifySearchTracksResponse,
    SpotifyTrackDetails,
    SpotifyTrackResponse,
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
    return findMatchingAlbum({
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
    console.log('Found matching Spotify album', {
        albumName: matchingAlbum.data.name,
        artistName: matchingAlbum.data.artists.items[0]?.profile.name,
        releaseDate: matchingAlbum.data.date.year,
    });

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

export function parseSpotifyTrackId(spotifyUrl: string): string {
    const { hostname, pathname } = new URL(spotifyUrl);

    if (hostname !== 'open.spotify.com') {
        throw new Error('Invalid Spotify URL');
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments[0] !== 'track') {
        throw new Error('Invalid Spotify URL');
    }

    const spotifyId = pathSegments[1];

    if (!spotifyId) {
        throw new Error('Invalid Spotify URL');
    }

    return spotifyId;
}

export async function getSpotifyTrackData(
    spotifyUrl: string,
    client: SpotifyClient = createSpotifyClient(),
): Promise<SpotifyTrackResponse> {
    const spotifyId = parseSpotifyTrackId(spotifyUrl);

    try {
        return await client.getTrack(spotifyId);
    } catch (error) {
        logger.error('Failed to fetch Spotify track data', { error, spotifyId });
        throw new Error('Failed to fetch Spotify track data');
    }
}

export function getSpotifyTrackDetails(trackData: SpotifyTrackResponse): SpotifyTrackDetails {
    const trackUnion = trackData.data?.trackUnion;

    if (!trackUnion) {
        throw new Error('Spotify response did not include a track');
    }

    const artistNames = trackUnion.artistsWithRoles.items
        .map((item) => item.artist.profile.name)
        .filter((name) => name.length > 0);

    const primaryArtistName = artistNames[0];

    if (!primaryArtistName) {
        throw new Error('Spotify track is missing artists');
    }

    const imageUrl = trackUnion.albumOfTrack.coverArt.sources[0]?.url ?? '';
    const { isoString, precision } = trackUnion.albumOfTrack.date;
    let releaseDate: string;

    switch (precision.toUpperCase()) {
        case 'DAY':
            releaseDate = isoString.slice(0, 10);
            break;
        case 'MONTH':
            releaseDate = isoString.slice(0, 7);
            break;
        case 'YEAR':
            releaseDate = isoString.slice(0, 4);
            break;
        default:
            releaseDate = isoString;
    }

    return {
        spotifyUrl: trackUnion.sharingInfo.shareUrl,
        trackName: trackUnion.name,
        albumName: trackUnion.albumOfTrack.name,
        artistName: artistNames.join(', '),
        primaryArtistName,
        imageUrl,
        releaseDate,
    };
}

export function getSpotifyTrackUrlFromSearchResult(track: SpotifySearchTrackItem): string {
    return `https://open.spotify.com/track/${getSpotifyIdFromUri(track.item.data.uri)}`;
}

export function findMatchingSpotifyTrack(
    tracks: SpotifySearchTrackItem[],
    requestedTrackName: string,
    requestedArtistName: string,
): SpotifySearchTrackItem | undefined {
    const normalizedRequestedTrackName = normalizeText(requestedTrackName);
    const normalizedRequestedArtistName = normalizeText(requestedArtistName);

    let bestMatch: SpotifySearchTrackItem | undefined;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const track of tracks) {
        const trackData = track.item.data;
        const normalizedTrackName = normalizeText(trackData.name);
        const normalizedPrimaryArtistName = normalizeText(trackData.artists.items[0]?.profile.name ?? '');
        let score = 0;

        if (normalizedTrackName === normalizedRequestedTrackName) {
            score += 4;
        }

        if (normalizedPrimaryArtistName === normalizedRequestedArtistName) {
            score += 3;
        }

        if (score > bestScore) {
            bestMatch = track;
            bestScore = score;
        }
    }

    return bestMatch;
}

export async function searchSpotifyTracks(
    trackName: string,
    artistName: string,
    client: SpotifyClient = createSpotifyClient(),
): Promise<SpotifySearchTracksResponse> {
    return client.searchTracks(`${artistName} ${trackName}`, 10);
}

export async function findSpotifyTrackUrl(
    trackName: string,
    artistName: string,
    client: SpotifyClient = createSpotifyClient(),
): Promise<string> {
    const searchResults = await searchSpotifyTracks(trackName, artistName, client);
    const tracks = searchResults.data.searchV2.tracksV2.items;
    const matchingTrack = findMatchingSpotifyTrack(tracks, trackName, artistName);

    if (!matchingTrack) {
        throw new Error('Track not found on Spotify');
    }

    return getSpotifyTrackUrlFromSearchResult(matchingTrack);
}
