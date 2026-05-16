export interface SpotifyAlbumResponse {
    data?: {
        albumUnion?: SpotifyAlbumData;
    };
}

export interface SpotifyAlbumData {
    __typename?: string;
    uri: string;
    name: string;
    artists: {
        items: SpotifyArtist[];
    };
    coverArt: {
        sources: SpotifyImageSource[];
    };
    date: {
        isoString: string;
        precision: string;
    };
    sharingInfo?: {
        shareUrl?: string;
    };
}

export interface SpotifyArtist {
    uri: string;
    profile: {
        name: string;
    };
}

export interface SpotifyImageSource {
    url: string;
    width?: number;
    height?: number;
}

export interface SpotifyAlbumDetails {
    spotifyUrl: string;
    albumName: string;
    artistName: string;
    primaryArtistName: string;
    imageUrl: string;
    releaseDate: string;
}

export interface SpotifySearchAlbumItem {
    data: {
        __typename: string;
        uri: string;
        name: string;
        artists: {
            items: SpotifyArtist[];
        };
        coverArt: {
            sources: SpotifyImageSource[];
        };
        date: {
            year: number;
        };
    };
}

export interface SpotifySearchAlbumsResponse {
    data: {
        searchV2: {
            albums: {
                items: SpotifySearchAlbumItem[];
            };
        };
    };
}

export interface SpotifyClient {
    getAlbum(id: string): Promise<SpotifyAlbumResponse>;
    searchAlbums(terms: string, limit?: number): Promise<SpotifySearchAlbumsResponse>;
}
