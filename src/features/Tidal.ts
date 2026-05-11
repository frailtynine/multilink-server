import { releaseDatesMatch } from '../utils/releaseDate';
import {
    TidalAlbum,
    TidalAlbumRelationship,
    TidalSearchResponse,
} from '../types/tidal';

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

function normalizeAlbumTitle(title: string): string {
    return title.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function isAlbumRelationship(relationship: TidalAlbumRelationship): boolean {
    return relationship.type === 'albums';
}

function isAlbum(result: TidalAlbum): boolean {
    return result.type === 'albums';
}

export function extractTidalAlbums(searchResponse: TidalSearchResponse): TidalAlbum[] {
    const relatedAlbumIds = searchResponse.data?.relationships?.albums?.data
        ?.filter(isAlbumRelationship)
        .map(({ id }) => id) ?? [];

    const includedAlbums = (searchResponse.included ?? []).filter(isAlbum);

    if (relatedAlbumIds.length === 0) {
        return includedAlbums;
    }

    const albumsById = new Map(includedAlbums.map((album) => [album.id, album]));

    return relatedAlbumIds
        .map((albumId) => albumsById.get(albumId))
        .filter((album): album is TidalAlbum => album !== undefined);
}

export function findMatchingTidalAlbum(
    albums: TidalAlbum[],
    requestedAlbumName: string,
    spotifyReleaseDate?: string,
): TidalAlbum | undefined {
    const normalizedRequestedAlbumName = normalizeAlbumTitle(requestedAlbumName);
    const albumsWithMatchingTitle = albums.filter((album) => {
        const albumTitle = album.attributes?.title;

        return albumTitle !== undefined && normalizeAlbumTitle(albumTitle) === normalizedRequestedAlbumName;
    });
    const titleCandidates = albumsWithMatchingTitle.length > 0 ? albumsWithMatchingTitle : albums;

    if (spotifyReleaseDate) {
        const albumWithMatchingReleaseDate = titleCandidates.find((album) => {
            const releaseDate = album.attributes?.releaseDate;

            return releaseDate !== undefined && releaseDatesMatch(spotifyReleaseDate, releaseDate);
        });

        if (albumWithMatchingReleaseDate) {
            return albumWithMatchingReleaseDate;
        }
    }

    return titleCandidates[0];
}

export function getTidalAlbumUrl(album: TidalAlbum): string | undefined {
    const externalLinks = album.attributes?.externalLinks ?? [];
    const tidalSharingLink = externalLinks.find((link) => link.meta?.type === 'TIDAL_SHARING');

    return tidalSharingLink?.href ?? externalLinks[0]?.href;
}

async function searchTidalAlbums(
    accessToken: string,
    albumName: string,
    artistName: string,
): Promise<TidalAlbum[]> {
    const query = `${artistName} ${albumName}`;
    const searchUrl = new URL(`https://openapi.tidal.com/v2/searchResults/${encodeURIComponent(query)}`);

    searchUrl.searchParams.set('include', 'albums');
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

    return extractTidalAlbums(payload);
}

async function getTidalUrl(
    albumName: string,
    artistName: string,
    spotifyReleaseDate?: string,
): Promise<string> {
    const accessToken = await getAccessToken();
    const albums = await searchTidalAlbums(accessToken, albumName, artistName);
    const matchingAlbum = findMatchingTidalAlbum(albums, albumName, spotifyReleaseDate);
    const tidalUrl = matchingAlbum ? getTidalAlbumUrl(matchingAlbum) : undefined;

    if (!tidalUrl) {
        throw new Error('Album not found on Tidal');
    }

    return tidalUrl;
}

export default getTidalUrl;
