import {
    BandcampAlbumDetails,
    getBandcampAlbumDetailsFromUrl,
    getBandcampTrackDetailsFromUrl,
    getBandcampUrlType,
    parseBandcampUrl,
} from './Bandcamp';
import {
    getSpotifyAlbumDetails,
    getSpotifyData,
    getSpotifyTrackData,
    getSpotifyTrackDetails,
    parseSpotifyId,
    parseSpotifyTrackId,
} from './Spotify';
import {
    getAppleMusicAlbumDetailsFromUrl,
    getAppleMusicTrackDetailsFromUrl,
    getAppleMusicUrlType,
    parseAppleMusicUrl,
} from './AppleMusic/AppleMusicInput';

export type InputSource = 'spotify' | 'bandcamp' | 'appleMusic';

export type InputItemDetails = (ReturnType<typeof getSpotifyAlbumDetails> | BandcampAlbumDetails) & {
    itemType: 'album' | 'track';
};

export interface ResolvedInput {
    source: InputSource;
    itemType: 'album' | 'track';
    itemDetails: InputItemDetails;
    spotifyUrl?: string;
    bandcampUrl?: string;
    appleMusicUrl?: string;
}

export class InvalidInputUrlError extends Error {
    constructor() {
        super('Invalid URL. Expected a Spotify, Bandcamp, or Apple Music album or track URL');
    }
}

export function detectInputSource(url: string): { source: InputSource; itemType: 'album' | 'track' } {
    try {
        parseSpotifyTrackId(url);
        return { source: 'spotify', itemType: 'track' };
    } catch {
    }

    try {
        parseSpotifyId(url);
        return { source: 'spotify', itemType: 'album' };
    } catch {
    }

    try {
        parseBandcampUrl(url);
        return { source: 'bandcamp', itemType: getBandcampUrlType(url) };
    } catch {
    }

    try {
        parseAppleMusicUrl(url);
        return { source: 'appleMusic', itemType: getAppleMusicUrlType(url) };
    } catch {
    }

    throw new InvalidInputUrlError();
}

export async function resolveInputFromUrl(url: string): Promise<ResolvedInput> {
    const { source, itemType } = detectInputSource(url);

    if (source === 'spotify') {
        if (itemType === 'track') {
            const trackDetails = getSpotifyTrackDetails(await getSpotifyTrackData(url));

            return {
                source,
                itemType,
                itemDetails: {
                    albumName: trackDetails.trackName,
                    artistName: trackDetails.artistName,
                    primaryArtistName: trackDetails.primaryArtistName,
                    imageUrl: trackDetails.imageUrl,
                    releaseDate: trackDetails.releaseDate,
                    itemType,
                },
                spotifyUrl: trackDetails.spotifyUrl,
            };
        }

        const spotifyAlbumDetails = getSpotifyAlbumDetails(await getSpotifyData(url));

        return {
            source,
            itemType,
            itemDetails: {
                ...spotifyAlbumDetails,
                itemType,
            },
            spotifyUrl: spotifyAlbumDetails.spotifyUrl,
        };
    }

    if (source === 'bandcamp') {
        if (itemType === 'track') {
            const trackDetails = await getBandcampTrackDetailsFromUrl(url);

            return {
                source,
                itemType,
                itemDetails: {
                    albumName: trackDetails.trackName,
                    artistName: trackDetails.artistName,
                    primaryArtistName: trackDetails.primaryArtistName,
                    imageUrl: trackDetails.imageUrl,
                    releaseDate: trackDetails.releaseDate,
                    itemType,
                },
                bandcampUrl: url,
            };
        }

        const bandcampDetails = await getBandcampAlbumDetailsFromUrl(url);

        return {
            source,
            itemType,
            itemDetails: {
                ...bandcampDetails,
                itemType,
            },
            bandcampUrl: url,
        };
    }

    if (itemType === 'track') {
        const trackDetails = await getAppleMusicTrackDetailsFromUrl(url);

        return {
            source,
            itemType,
            itemDetails: {
                albumName: trackDetails.trackName,
                artistName: trackDetails.artistName,
                primaryArtistName: trackDetails.primaryArtistName,
                imageUrl: trackDetails.imageUrl,
                releaseDate: trackDetails.releaseDate,
                itemType,
            },
            appleMusicUrl: trackDetails.appleMusicUrl,
        };
    }

    const appleMusicDetails = await getAppleMusicAlbumDetailsFromUrl(url);

    return {
        source,
        itemType,
        itemDetails: {
            albumName: appleMusicDetails.albumName,
            artistName: appleMusicDetails.artistName,
            primaryArtistName: appleMusicDetails.primaryArtistName,
            imageUrl: appleMusicDetails.imageUrl,
            releaseDate: appleMusicDetails.releaseDate,
            itemType,
        },
        appleMusicUrl: appleMusicDetails.appleMusicUrl,
    };
}
