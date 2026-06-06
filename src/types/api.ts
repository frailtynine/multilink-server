export interface ErrorResponse {
    message: string;
}

export type ItemType = 'album' | 'track';

export interface GetLinksResponse {
    metacriticScore?: number;
    metacriticUrl?: string;
    spotifyUrl?: string;
    bandcampUrl: string;
    appleMusicUrl?: string;
    deezerUrl?: string;
    tidalUrl?: string;
    imageUrl: string;
    albumName: string;
    artistName: string;
    itemType?: ItemType;
}
