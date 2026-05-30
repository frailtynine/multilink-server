import { releaseDatesMatch } from './releaseDate';

export interface AlbumMatcherOptions<T> {
    albums: T[];
    requestedAlbumName: string;
    requestedArtistName?: string;
    requestedReleaseDate?: string;
    getAlbumName: (album: T) => string | undefined;
    getArtistName?: (album: T) => string | undefined;
    getReleaseDate?: (album: T) => string | undefined;
    matchesReleaseDate?: (requestedReleaseDate: string, albumReleaseDate: string) => boolean;
    requireReleaseDateMatch?: boolean;
}

function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function containsEitherWay(first: string, second: string): boolean {
    if (!first || !second) {
        return false;
    }

    return first.includes(second) || second.includes(first);
}

export function findMatchingAlbum<T>(options: AlbumMatcherOptions<T>): T | undefined {
    const {
        albums,
        requestedAlbumName,
        requestedArtistName,
        requestedReleaseDate,
        getAlbumName,
        getArtistName,
        getReleaseDate,
        matchesReleaseDate = releaseDatesMatch,
        requireReleaseDateMatch = false,
    } = options;

    const normalizedRequestedAlbumName = normalizeText(requestedAlbumName);
    const normalizedRequestedArtistName = requestedArtistName
        ? normalizeText(requestedArtistName)
        : undefined;

    const textMatches = albums.filter((album) => {
        const albumName = getAlbumName(album);

        if (!albumName) {
            return false;
        }

        const normalizedAlbumName = normalizeText(albumName);
        const albumMatches = containsEitherWay(normalizedAlbumName, normalizedRequestedAlbumName);

        if (!albumMatches) {
            return false;
        }

        if (!getArtistName) {
            return true;
        }

        const artistName = getArtistName(album);

        if (!artistName) {
            return false;
        }

        if (!normalizedRequestedArtistName) {
            return true;
        }

        const normalizedArtistName = normalizeText(artistName);
        const artistMatches = containsEitherWay(normalizedArtistName, normalizedRequestedArtistName);

        return artistMatches;
    });

    if (textMatches.length === 0) {
        return undefined;
    }

    if (!requestedReleaseDate || !getReleaseDate) {
        return textMatches[0];
    }

    const releaseDateMatches = textMatches.filter((album) => {
        const releaseDate = getReleaseDate(album);

        if (!releaseDate) {
            return false;
        }

        return matchesReleaseDate(requestedReleaseDate, releaseDate);
    });

    if (releaseDateMatches.length > 0) {
        return releaseDateMatches[0];
    }

    if (requireReleaseDateMatch) {
        return undefined;
    }

    return textMatches[0];
}
