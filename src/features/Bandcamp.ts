import bcfetch, { Album } from 'bandcamp-fetch';

export interface BandcampAlbumDetails {
    albumName: string;
    artistName: string;
    primaryArtistName: string;
    imageUrl: string;
    releaseDate?: string;
}

function normalizeBandcampSearchTerm(value: string): string {
    return value.trim().split(/\s+/).filter(Boolean).join('+');
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

export function composeBandcampSearchUrl(artistName: string, albumName: string): string {
    const query = [
        normalizeBandcampSearchTerm(artistName),
        normalizeBandcampSearchTerm(albumName),
    ].filter(Boolean).join(' ');

    const searchParams = new URLSearchParams({
        q: query,
        item_type: 'a',
    });

    return `https://bandcamp.com/search?${searchParams.toString()}`;
}
