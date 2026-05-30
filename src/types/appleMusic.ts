export interface AppleMusicAlbumResult {
    id: string;
    type: 'albums' | string;
    href?: string;
    attributes: {
        artistName?: string;
        name?: string;
        releaseDate?: string;
        url?: string;
    };
}

export interface AppleMusicSearchResultContainer {
    href?: string;
    name?: string;
    groupId?: string;
    data: AppleMusicAlbumResult[];
}

export type AppleMusicSongResult = AppleMusicAlbumResult;

export interface AppleMusicSearchResponse {
    results?: {
        albums?: AppleMusicSearchResultContainer;
        songs?: AppleMusicSearchResultContainer;
    };
}
