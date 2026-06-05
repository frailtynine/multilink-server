export interface DeezerSearchResponse {
    data: DeezerAlbum[];
    total?: number;
}

export interface DeezerAlbum {
    id: number;
    title: string;
    link: string;
    artist?: DeezerArtist;
    type?: string;
}

export interface DeezerArtist {
    id?: number;
    name: string;
    link?: string;
}

export interface DeezerTrack {
    id: number;
    title: string;
    link: string;
    artist?: DeezerArtist;
    release_date?: string;
}

export interface DeezerTrackSearchResponse {
    data: DeezerTrack[];
    total?: number;
}

export interface DeezerSearchBuilder {
    album(title: string): DeezerSearchBuilder;
    build(): string;
}

export interface DeezerClient {
    search: {
        builder(query?: string): DeezerSearchBuilder;
        album(options: { q: string }): Promise<DeezerSearchResponse>;
        track(options: { q: string }): Promise<DeezerTrackSearchResponse>;
    };
}
