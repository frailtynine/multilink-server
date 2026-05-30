export interface TidalSearchResponse {
    data?: {
        relationships?: {
            albums?: {
                data?: TidalAlbumRelationship[];
            };
        };
    };
    included?: TidalIncludedResource[];
}

export type TidalIncludedResource = TidalAlbum | TidalArtist;

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
