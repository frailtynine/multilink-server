export interface TidalSearchResponse {
    data?: {
        relationships?: {
            albums?: {
                data?: TidalAlbumRelationship[];
            };
        };
    };
    included?: TidalAlbum[];
}

export interface TidalAlbumRelationship {
    id: string;
    type: string;
}

export interface TidalAlbum {
    id: string;
    type: string;
    attributes?: {
        title?: string;
        releaseDate?: string;
        externalLinks?: TidalAlbumExternalLink[];
    };
}

export interface TidalAlbumExternalLink {
    href: string;
    meta?: {
        type?: string;
    };
}
