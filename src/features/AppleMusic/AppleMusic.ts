import getAppleMusicDevToken from './AppleMusicDevToken';
import {
    AppleMusicAlbumResult,
    AppleMusicSearchResponse,
    AppleMusicSearchResultContainer,
    AppleMusicSongResult,
} from '../../types/appleMusic';
import { findMatchingAlbum } from '../../utils/albumMatching';
import { releaseDatesMatch } from '../../utils/releaseDate';


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

export enum ResourceType {
    Albums = 'albums',
    Songs = 'songs',
}

function resolveAppleMusicRegion(): string {
    const configuredRegion = process.env.APPLE_MUSIC_REGION?.trim().toLowerCase();

    if (configuredRegion && /^[a-z]{2}$/.test(configuredRegion)) {
        return configuredRegion;
    }

    return 'us';
}

class AppleMusicApiClient implements AppleMusicClient {
    private readonly region: string;
    private developerToken?: string;

    constructor(region: string) {
        this.region = region;
    }

    async init(): Promise<void> {
        if (!this.developerToken) {
            this.developerToken = await getAppleMusicDevToken();
        }
    }

    Search = {
        search: async (options: {
            term: string;
            types: ResourceType[];
            limit: number;
        }): Promise<AppleMusicSearchResponse> => {
            if (!this.developerToken) {
                throw new Error('Apple Music client not initialized');
            }

            const url = new URL(`https://api.music.apple.com/v1/catalog/${this.region}/search`);
            url.searchParams.set('term', options.term);
            url.searchParams.set('types', options.types.join(','));
            url.searchParams.set('limit', String(options.limit));

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${this.developerToken}`,
                },
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(`Apple Music search failed (${response.status}): ${body}`);
            }

            return (await response.json()) as AppleMusicSearchResponse;
        },
    };
}

export function createAppleMusicClient(): AppleMusicClient {
    return new AppleMusicApiClient(resolveAppleMusicRegion());
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

export async function searchAppleMusic(
    artistName: string,
    name: string,
    type: ResourceType,
    client: AppleMusicClient = createAppleMusicClient(),
): Promise<AppleMusicSearchResponse> {
    await client.init();

    return client.Search.search({ term: `${artistName} ${name}`, types: [type], limit: 10 });
}

export function extractAppleMusicSongs(
    searchResponse: AppleMusicSearchResponse,
): AppleMusicSongResult[] {
    const songGroup: AppleMusicSearchResultContainer | undefined = searchResponse.results?.songs;

    return songGroup?.data ?? [];
}

export function findMatchingAppleMusicSong(
    results: AppleMusicSongResult[],
    spotifyReleaseDate?: string,
): AppleMusicSongResult | undefined {
    if (!spotifyReleaseDate) {
        return results[0];
    }

    const matchingSong = results.find((song) => {
        const releaseDate = song.attributes.releaseDate;

        return releaseDate !== undefined && releaseDatesMatch(spotifyReleaseDate, releaseDate);
    });

    return matchingSong ?? results[0];
}

const AppleMusicFinder = async (
    name: string,
    artistName: string,
    releaseDate?: string,
    client?: AppleMusicClient,
    itemType: 'album' | 'track' = 'album',
): Promise<string> => {
    if (itemType === 'track') {
        const response = await searchAppleMusic(artistName, name, ResourceType.Songs, client);
        const url = findMatchingAppleMusicSong(extractAppleMusicSongs(response), releaseDate)?.attributes.url;

        if (!url) {
            throw new Error('Song not found on Apple Music');
        }

        return url;
    }

    const response = await searchAppleMusic(artistName, name, ResourceType.Albums, client);
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

export { AppleMusicFinder };
