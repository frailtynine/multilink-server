export interface ErrorResponse {
    message: string;
}

export interface GetLinksResponse {
    spotifyUrl?: string;
    bandcampUrl: string;
    appleMusicUrl?: string;
    deezerUrl?: string;
    tidalUrl?: string;
    imageUrl: string;
    albumName: string;
    artistName: string;
}
