import { DeezerPublicApi } from 'deezer-public-api';
import {
    DeezerAlbum,
    DeezerClient,
    DeezerSearchResponse,
} from '../types/deezer';
import { findMatchingAlbum } from '../utils/albumMatching';

export function createDeezerClient(): DeezerClient {
    return new DeezerPublicApi();
}

export function findMatchingDeezerAlbum(
    albums: DeezerAlbum[],
    requestedAlbumName: string,
    requestedArtistName: string,
): DeezerAlbum | undefined {
    return findMatchingAlbum({
        albums,
        requestedAlbumName,
        requestedArtistName,
        getAlbumName: (album) => album.title,
        getArtistName: (album) => album.artist?.name,
    });
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
