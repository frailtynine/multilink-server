import { AppleMusic, AuthType, Region, ResourceType } from '@syncfm/applemusic-api';
import {
    AppleMusicAlbumResult,
    AppleMusicSearchResponse,
    AppleMusicSearchResultContainer,
} from '../types/appleMusic';

const SEVEN_DAYS_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

export interface AppleMusicClient {
    init(): Promise<void>;
    Search: {
        search(options: {
            term: string;
            types: ResourceType[];
            limit: number;
        }): Promise<AppleMusicSearchResponse>;
    };
}

export function createAppleMusicClient(): AppleMusicClient {
    return new AppleMusic({
        region: Region.RU,
        authType: AuthType.Scraped,
    });
}

function parseSpotifyReleaseDate(spotifyReleaseDate: string): number | undefined {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(spotifyReleaseDate)) {
        return undefined;
    }

    const timestamp = Date.parse(`${spotifyReleaseDate}T00:00:00Z`);

    return Number.isNaN(timestamp) ? undefined : timestamp;
}

export function extractAppleMusicAlbums(
    searchResponse: AppleMusicSearchResponse,
): AppleMusicAlbumResult[] {
    const albumGroup: AppleMusicSearchResultContainer | undefined = searchResponse.results?.albums;

    return albumGroup?.data ?? [];
}

export function findMatchingAppleMusicAlbum(
    results: AppleMusicAlbumResult[],
    spotifyReleaseDate: string,
): AppleMusicAlbumResult | undefined {
    const spotifyReleaseTimestamp = parseSpotifyReleaseDate(spotifyReleaseDate);

    if (spotifyReleaseTimestamp === undefined) {
        return undefined;
    }

    let bestMatch: AppleMusicAlbumResult | undefined;
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

const getAppleMusicData = async (
    artistName: string,
    albumName: string,
    client: AppleMusicClient = createAppleMusicClient(),
): Promise<AppleMusicSearchResponse> => {
    await client.init();

    return client.Search.search({
        term: `${artistName} ${albumName}`,
        types: [ResourceType.Albums],
        limit: 10,
    });
};

const AppleMusicFinder = async (
    albumName: string,
    artistName: string,
    spotifyReleaseDate?: string,
    client?: AppleMusicClient,
): Promise<string> => {
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

export { AppleMusicFinder, getAppleMusicData };
