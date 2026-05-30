import { DeezerPublicApi } from 'deezer-public-api';
import {
    DeezerAlbum,
    DeezerClient,
    DeezerSearchResponse,
    DeezerTrack,
    DeezerTrackSearchResponse,
} from '../types/deezer';
import { findMatchingAlbum, normalizeText } from '../utils/albumMatching';

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

export async function searchDeezerTracks(
    trackName: string,
    artistName: string,
    client: DeezerClient = createDeezerClient(),
): Promise<DeezerTrackSearchResponse> {
    return client.search.track({ q: `${artistName} ${trackName}` });
}

export function findMatchingDeezerTrack(
    tracks: DeezerTrack[],
    requestedTrackName: string,
    requestedArtistName: string,
): DeezerTrack | undefined {
    const normalizedTrackName = normalizeText(requestedTrackName);
    const normalizedArtistName = normalizeText(requestedArtistName);
    const titleMatches = tracks.filter((track) => normalizeText(track.title) === normalizedTrackName);
    const titleCandidates = titleMatches.length > 0 ? titleMatches : tracks;
    const artistMatches = titleCandidates.filter((track) => {
        const artistName = track.artist?.name;

        return artistName !== undefined && normalizeText(artistName) === normalizedArtistName;
    });

    return (artistMatches.length > 0 ? artistMatches : titleCandidates)[0];
}

export function getDeezerTrackUrl(track: DeezerTrack): string {
    return track.link;
}

const getDeezerData = async (
    albumName: string,
    artistName: string,
    itemType: 'album' | 'track' = 'album',
    client: DeezerClient = createDeezerClient(),
): Promise<string> => {
    if (itemType === 'track') {
        const searchResults = await searchDeezerTracks(albumName, artistName, client);
        const matchingTrack = findMatchingDeezerTrack(
            searchResults.data,
            albumName,
            artistName,
        );

        if (!matchingTrack) {
            throw new Error('Track not found on Deezer');
        }

        return getDeezerTrackUrl(matchingTrack);
    }

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
