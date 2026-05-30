import { AppleMusic, AuthType, Region, ResourceType } from '@syncfm/applemusic-api';
import {
    AppleMusicAlbumResult,
    AppleMusicSearchResponse,
    AppleMusicSearchResultContainer,
} from '../types/appleMusic';
import { findMatchingAlbum } from '../utils/albumMatching';

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

function resolveAppleMusicRegion(): Region {
    const configuredRegion = process.env.APPLE_MUSIC_REGION?.toLowerCase();
    const supportedRegions = new Set<string>(Object.values(Region));

    if (configuredRegion && supportedRegions.has(configuredRegion)) {
        return configuredRegion as Region;
    }

    return Region.US;
}

export function createAppleMusicClient(): AppleMusicClient {
    return new AppleMusic({
        region: resolveAppleMusicRegion(),
        authType: AuthType.Scraped,
    });
}

export function extractAppleMusicAlbums(
    searchResponse: AppleMusicSearchResponse,
): AppleMusicAlbumResult[] {
    const albumGroup: AppleMusicSearchResultContainer | undefined = searchResponse.results?.albums;

    return albumGroup?.data ?? [];
}

export function findMatchingAppleMusicAlbum(
    results: AppleMusicAlbumResult[],
    requestedAlbumName: string,
    requestedArtistName: string,
    spotifyReleaseDate: string,
): AppleMusicAlbumResult | undefined {
    return findMatchingAlbum({
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

export { AppleMusicFinder, getAppleMusicData };
