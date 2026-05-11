import { DeezerPublicApi } from 'deezer-public-api';
import {
    DeezerAlbum,
    DeezerClient,
    DeezerSearchResponse,
} from '../types/deezer';

export function createDeezerClient(): DeezerClient {
    return new DeezerPublicApi();
}

function normalizeText(value: string): string {
    return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function findMatchingDeezerAlbum(
    albums: DeezerAlbum[],
    requestedAlbumName: string,
    requestedArtistName: string,
): DeezerAlbum | undefined {
    const normalizedAlbumName = normalizeText(requestedAlbumName);
    const normalizedArtistName = normalizeText(requestedArtistName);
    const albumMatches = albums.filter((album) => normalizeText(album.title) === normalizedAlbumName);
    const albumCandidates = albumMatches.length > 0 ? albumMatches : albums;
    const artistMatches = albumCandidates.filter((album) => {
        const artistName = album.artist?.name;

        return artistName !== undefined && normalizeText(artistName) === normalizedArtistName;
    });

    return (artistMatches.length > 0 ? artistMatches : albumCandidates)[0];
}

export function getDeezerAlbumUrl(album: DeezerAlbum): string {
    return album.link;
}

export async function searchDeezerAlbums(
    albumName: string,
    artistName: string,
    client: DeezerClient = createDeezerClient(),
): Promise<DeezerSearchResponse> {
    const query = client.search.builder(artistName)
        .album(albumName)
        .build();

    return client.search.album({ q: query });
}

const getDeezerData = async (
    albumName: string,
    artistName: string,
    client: DeezerClient = createDeezerClient(),
): Promise<string> => {
    const searchResults = await searchDeezerAlbums(albumName, artistName, client);
    const matchingAlbum = findMatchingDeezerAlbum(
        searchResults.data,
        albumName,
        artistName,
    );

    if (!matchingAlbum) {
        throw new Error('Album not found on Deezer');
    }

    return getDeezerAlbumUrl(matchingAlbum);
};

export default getDeezerData;
