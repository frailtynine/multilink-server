import getAppleMusicDevToken from './AppleMusicDevToken';

export interface AppleMusicAlbumDetails {
    albumName: string;
    artistName: string;
    primaryArtistName: string;
    imageUrl: string;
    releaseDate?: string;
    appleMusicUrl: string;
}

export interface AppleMusicTrackDetails {
    trackName: string;
    albumName?: string;
    artistName: string;
    primaryArtistName: string;
    imageUrl: string;
    releaseDate?: string;
    appleMusicUrl: string;
}

interface ParsedAppleMusicUrl {
    storefront: string;
    itemType: 'album' | 'track';
    resourceId: string;
}

interface AppleMusicArtwork {
    url?: string;
    width?: number;
    height?: number;
}

interface AppleMusicResourceAttributes {
    name?: string;
    albumName?: string;
    artistName?: string;
    releaseDate?: string;
    url?: string;
    artwork?: AppleMusicArtwork;
}

interface AppleMusicResourceResponse {
    data?: Array<{
        attributes?: AppleMusicResourceAttributes;
    }>;
}

function resolveDefaultStorefront(): string {
    const configuredRegion = process.env.APPLE_MUSIC_REGION?.trim().toLowerCase();

    if (configuredRegion && /^[a-z]{2}$/.test(configuredRegion)) {
        return configuredRegion;
    }

    return 'us';
}

function normalizeAppleMusicResourceId(resourceId: string | null): string {
    const normalizedId = resourceId?.trim();

    if (!normalizedId || !/^\d+$/.test(normalizedId)) {
        throw new Error('Invalid Apple Music URL');
    }

    return normalizedId;
}

export function parseAppleMusicUrl(appleMusicUrl: string): ParsedAppleMusicUrl {
    const parsedUrl = new URL(appleMusicUrl);

    if (parsedUrl.hostname !== 'music.apple.com') {
        throw new Error('Invalid Apple Music URL');
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const maybeStorefront = pathSegments[0]?.toLowerCase();
    const hasStorefront = maybeStorefront !== undefined && /^[a-z]{2}$/.test(maybeStorefront);
    const storefront = hasStorefront ? maybeStorefront : resolveDefaultStorefront();
    const resourceType = pathSegments[hasStorefront ? 1 : 0]?.toLowerCase();

    if (!resourceType) {
        throw new Error('Invalid Apple Music URL');
    }

    if (parsedUrl.searchParams.has('i')) {
        return {
            storefront,
            itemType: 'track',
            resourceId: normalizeAppleMusicResourceId(parsedUrl.searchParams.get('i')),
        };
    }

    const trailingId = pathSegments[pathSegments.length - 1] ?? null;

    if (resourceType === 'song' || resourceType === 'track') {
        return {
            storefront,
            itemType: 'track',
            resourceId: normalizeAppleMusicResourceId(trailingId),
        };
    }

    if (resourceType !== 'album') {
        throw new Error('Invalid Apple Music URL');
    }

    return {
        storefront,
        itemType: 'album',
        resourceId: normalizeAppleMusicResourceId(trailingId),
    };
}

export function getAppleMusicUrlType(appleMusicUrl: string): 'album' | 'track' {
    return parseAppleMusicUrl(appleMusicUrl).itemType;
}

function toArtworkUrl(artwork?: AppleMusicArtwork): string {
    const template = artwork?.url;

    if (!template) {
        return '';
    }

    const width = artwork?.width ?? 1000;
    const height = artwork?.height ?? 1000;

    return template
        .replace('{w}', String(width))
        .replace('{h}', String(height));
}

async function fetchAppleMusicResource(
    storefront: string,
    resourceType: 'albums' | 'songs',
    resourceId: string,
): Promise<AppleMusicResourceAttributes> {
    const token = await getAppleMusicDevToken();
    const endpoint = `https://api.music.apple.com/v1/catalog/${storefront}/${resourceType}/${encodeURIComponent(resourceId)}`;
    const response = await fetch(endpoint, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Apple Music ${resourceType} lookup failed (${response.status}): ${body}`);
    }

    const payload = await response.json() as AppleMusicResourceResponse;
    const attributes = payload.data?.[0]?.attributes;

    if (!attributes) {
        throw new Error('Apple Music lookup response did not include item attributes');
    }

    return attributes;
}

export async function getAppleMusicAlbumDetailsFromUrl(appleMusicUrl: string): Promise<AppleMusicAlbumDetails> {
    const parsedUrl = parseAppleMusicUrl(appleMusicUrl);

    if (parsedUrl.itemType !== 'album') {
        throw new Error('Expected an Apple Music album URL');
    }

    const attributes = await fetchAppleMusicResource(parsedUrl.storefront, 'albums', parsedUrl.resourceId);
    const primaryArtistName = attributes.artistName?.trim();

    if (!primaryArtistName) {
        throw new Error('Apple Music album is missing artists');
    }

    return {
        albumName: attributes.name ?? '',
        artistName: primaryArtistName,
        primaryArtistName,
        imageUrl: toArtworkUrl(attributes.artwork),
        releaseDate: attributes.releaseDate,
        appleMusicUrl: attributes.url ?? appleMusicUrl,
    };
}

export async function getAppleMusicTrackDetailsFromUrl(appleMusicUrl: string): Promise<AppleMusicTrackDetails> {
    const parsedUrl = parseAppleMusicUrl(appleMusicUrl);

    if (parsedUrl.itemType !== 'track') {
        throw new Error('Expected an Apple Music track URL');
    }

    const attributes = await fetchAppleMusicResource(parsedUrl.storefront, 'songs', parsedUrl.resourceId);
    const primaryArtistName = attributes.artistName?.trim();

    if (!primaryArtistName) {
        throw new Error('Apple Music track is missing artists');
    }

    return {
        trackName: attributes.name ?? '',
        albumName: attributes.albumName,
        artistName: primaryArtistName,
        primaryArtistName,
        imageUrl: toArtworkUrl(attributes.artwork),
        releaseDate: attributes.releaseDate,
        appleMusicUrl: attributes.url ?? appleMusicUrl,
    };
}
