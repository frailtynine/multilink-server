export interface TidalTrackRelationship {
    id: string;
    type: string;
}

export interface TidalTrack {
    id: string;
    type: string;
    attributes?: {
        title?: string;
        releaseDate?: string;
        externalLinks?: TidalAlbumExternalLink[];
    };
}

export interface TidalSearchResponse {
    data?: {
        relationships?: {
            albums?: {
                data?: TidalAlbumRelationship[];
            };
            tracks?: {
                data?: TidalTrackRelationship[];
            };
        };
    };
    included?: TidalIncludedResource[];
}

export type TidalIncludedResource = TidalAlbum | TidalArtist | TidalTrack;

export interface TidalAlbumRelationship {
    id: string;
    type: string;
}

export interface TidalAlbum {
    id: string;
    type: string;
    relationships?: {
        artists?: {
            data?: TidalAlbumRelationship[];
        };
    };
    attributes?: {
        title?: string;
        releaseDate?: string;
        externalLinks?: TidalAlbumExternalLink[];
    };
    artistNames?: string[];
}

export interface TidalArtist {
    id: string;
    type: string;
    attributes?: {
        name?: string;
    };
}

export interface TidalAlbumExternalLink {
    href: string;
    meta?: {
        type?: string;
    };
}
