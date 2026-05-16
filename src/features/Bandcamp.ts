import bcfetch, { Album } from 'bandcamp-fetch';

export interface BandcampAlbumDetails {
    albumName: string;
    artistName: string;
    primaryArtistName: string;
    imageUrl: string;
    releaseDate?: string;
}

export function parseBandcampAlbumUrl(bandcampUrl: string): string {
    const { hostname, pathname } = new URL(bandcampUrl);

    if (hostname !== 'bandcamp.com' && !hostname.endsWith('.bandcamp.com')) {
        throw new Error('Invalid Bandcamp URL');
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments[0] !== 'album' || !pathSegments[1]) {
        throw new Error('Invalid Bandcamp URL');
    }

    return bandcampUrl;
}

export function normalizeBandcampReleaseDate(releaseDate?: string): string | undefined {
    if (!releaseDate) {
        return undefined;
    }

    const timestamp = Date.parse(releaseDate);

    if (Number.isNaN(timestamp)) {
        return undefined;
    }

    return new Date(timestamp).toISOString().slice(0, 10);
}

export function getBandcampAlbumDetails(album: Album): BandcampAlbumDetails {
    const primaryArtistName = album.artist?.name?.trim();

    if (!primaryArtistName) {
        throw new Error('Bandcamp album is missing artists');
    }

    return {
        albumName: album.name,
        artistName: primaryArtistName,
        primaryArtistName,
        imageUrl: album.imageUrl ?? '',
        releaseDate: normalizeBandcampReleaseDate(album.releaseDate),
    };
}

export async function getBandcampAlbumData(
    bandcampUrl: string,
): Promise<Album> {
    return bcfetch.album.getInfo({
        albumUrl: parseBandcampAlbumUrl(bandcampUrl),
    });
}

export async function getBandcampAlbumDetailsFromUrl(
    bandcampUrl: string,
): Promise<BandcampAlbumDetails> {
    return getBandcampAlbumDetails(await getBandcampAlbumData(bandcampUrl));
}
