import { releaseDatesMatch } from '../utils/releaseDate';
import { findMatchingAlbum } from '../utils/albumMatching';
import {
    TidalAlbum,
    TidalArtist,
    TidalIncludedResource,
    TidalSearchResponse,
    TidalTrack,
    TidalTrackRelationship,
} from '../types/tidal';

interface TidalAlbumCandidate {
    album: TidalAlbum;
    albumName: string;
    artistNames: string[];
    releaseDate?: string;
    url?: string;
}

function getTidalCredentials(): { clientId: string; clientSecret: string } {
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

async function getAccessToken(): Promise<string> {
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

    const payload = await response.json() as { access_token?: string };

    if (!payload.access_token) {
        throw new Error('Tidal auth response did not include an access token');
    }

    return payload.access_token;
}

function isAlbum(result: TidalIncludedResource): result is TidalAlbum {
    return result.type === 'albums';
}

function normalizeTitle(title: string): string {
    return title.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function isArtist(result: TidalIncludedResource): result is TidalArtist {
    return result.type === 'artists';
}

export function getTidalAlbumUrl(album: TidalAlbum): string | undefined {
    const externalLinks = album.attributes?.externalLinks ?? [];
    const tidalSharingLink = externalLinks.find((link) => link.meta?.type === 'TIDAL_SHARING');

    return tidalSharingLink?.href ?? externalLinks[0]?.href;
}

function mapTidalCandidates(searchResponse: TidalSearchResponse): TidalAlbumCandidate[] {
    const includedResources = searchResponse.included ?? [];
    const includedAlbums = includedResources.filter(isAlbum);
    const artistsById = new Map(
        includedResources
            .filter(isArtist)
            .map((artist) => [artist.id, artist.attributes?.name]),
    );
    const fallbackArtistNames = Array.from(artistsById.values()).filter(
        (artistName): artistName is string => Boolean(artistName),
    );

    const orderedAlbumIds = (searchResponse.data?.relationships?.albums?.data ?? [])
        .filter((relationship) => relationship.type === 'albums')
        .map((relationship) => relationship.id);
    const albumsToMap = orderedAlbumIds.length > 0
        ? orderedAlbumIds
            .map((albumId) => includedAlbums.find((album) => album.id === albumId))
            .filter((album): album is TidalAlbum => album !== undefined)
        : includedAlbums;

    return albumsToMap.map((album) => {
        const relatedArtistIds = album.relationships?.artists?.data
            ?.filter((relationship) => relationship.type === 'artists')
            .map((relationship) => relationship.id) ?? [];
        const relationshipArtistNames = relatedArtistIds
            .map((artistId) => artistsById.get(artistId))
            .filter((artistName): artistName is string => Boolean(artistName));
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

export function extractTidalAlbums(searchResponse: TidalSearchResponse): TidalAlbum[] {
    return mapTidalCandidates(searchResponse).map((candidate) => candidate.album);
}

export function findMatchingTidalAlbum(
    albums: TidalAlbum[],
    requestedAlbumName: string,
    requestedArtistName: string,
    spotifyReleaseDate?: string,
): TidalAlbum | undefined {
    const matchingAlbum = findMatchingAlbum({
        albums,
        requestedAlbumName,
        requestedArtistName,
        requestedReleaseDate: spotifyReleaseDate,
        getAlbumName: (album) => album.attributes?.title,
        getArtistName: (album) => album.artistNames?.join(', '),
        getReleaseDate: (album) => album.attributes?.releaseDate,
        matchesReleaseDate: releaseDatesMatch,
        requireReleaseDateMatch: true,
    });

    return matchingAlbum;
}

async function searchTidalCandidates(
    accessToken: string,
    albumName: string,
    artistName: string,
): Promise<TidalAlbumCandidate[]> {
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

    const payload = await response.json() as TidalSearchResponse;

    return mapTidalCandidates(payload);
}

function isTrackRelationship(relationship: TidalTrackRelationship): boolean {
    return relationship.type === 'tracks';
}

function isTrack(result: TidalIncludedResource): result is TidalTrack {
    return result.type === 'tracks';
}

export function extractTidalTracks(searchResponse: TidalSearchResponse): TidalTrack[] {
    const relatedTrackIds = searchResponse.data?.relationships?.tracks?.data
        ?.filter(isTrackRelationship)
        .map(({ id }) => id) ?? [];

    const includedTracks = (searchResponse.included ?? []).filter(isTrack);

    if (relatedTrackIds.length === 0) {
        return includedTracks;
    }

    const tracksById = new Map(includedTracks.map((track) => [track.id, track]));

    return relatedTrackIds
        .map((trackId) => tracksById.get(trackId))
        .filter((track): track is TidalTrack => track !== undefined);
}

export function findMatchingTidalTrack(
    tracks: TidalTrack[],
    requestedTrackName: string,
): TidalTrack | undefined {
    const normalizedRequestedTrackName = normalizeTitle(requestedTrackName);
    const tracksWithMatchingTitle = tracks.filter((track) => {
        const trackTitle = track.attributes?.title;

        return trackTitle !== undefined && normalizeTitle(trackTitle) === normalizedRequestedTrackName;
    });

    return (tracksWithMatchingTitle.length > 0 ? tracksWithMatchingTitle : tracks)[0];
}

export function getTidalTrackUrl(track: TidalTrack): string | undefined {
    const externalLinks = track.attributes?.externalLinks ?? [];
    const tidalSharingLink = externalLinks.find((link) => link.meta?.type === 'TIDAL_SHARING');

    return tidalSharingLink?.href ?? externalLinks[0]?.href;
}

async function searchTidalTracks(
    accessToken: string,
    trackName: string,
    artistName: string,
): Promise<TidalTrack[]> {
    const query = `${artistName} ${trackName}`;
    const searchUrl = new URL(`https://openapi.tidal.com/v2/searchResults/${encodeURIComponent(query)}`);

    searchUrl.searchParams.set('include', 'tracks');
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

    const payload = await response.json() as TidalSearchResponse;

    return extractTidalTracks(payload);
}

async function getTidalUrl(
    albumName: string,
    artistName: string,
    spotifyReleaseDate?: string,
    itemType: 'album' | 'track' = 'album',
): Promise<string> {
    const accessToken = await getAccessToken();

    if (itemType === 'track') {
        const tracks = await searchTidalTracks(accessToken, albumName, artistName);
        const matchingTrack = findMatchingTidalTrack(tracks, albumName);
        const trackUrl = matchingTrack ? getTidalTrackUrl(matchingTrack) : undefined;

        if (!trackUrl) {
            throw new Error('Track not found on Tidal');
        }

        return trackUrl;
    }

    const candidates = await searchTidalCandidates(accessToken, albumName, artistName);
    const matchingCandidate = findMatchingAlbum({
        albums: candidates,
        requestedAlbumName: albumName,
        requestedArtistName: artistName,
        requestedReleaseDate: spotifyReleaseDate,
        getAlbumName: (candidate) => candidate.albumName,
        getArtistName: (candidate) => candidate.artistNames.join(', '),
        getReleaseDate: (candidate) => candidate.releaseDate,
        matchesReleaseDate: releaseDatesMatch,
        requireReleaseDateMatch: true,
    });
    const tidalUrl = matchingCandidate?.url;

    if (!tidalUrl) {
        throw new Error('Album not found on Tidal');
    }

    return tidalUrl;
}

export default getTidalUrl;
