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

export interface SpotifyTrackData {
    __typename: string;
    id: string;
    uri: string;
    name: string;
    sharingInfo: {
        shareUrl: string;
        shareId: string;
    };
    artistsWithRoles: {
        items: Array<{
            role: string;
            artist: {
                id: string;
                uri: string;
                profile: {
                    name: string;
                };
            };
        }>;
    };
    albumOfTrack: {
        id: string;
        name: string;
        uri: string;
        date: {
            isoString: string;
            precision: string;
            year: number;
        };
        coverArt: {
            sources: Array<{
                url: string;
                width: number;
                height: number;
            }>;
        };
    };
}

export interface SpotifyTrackResponse {
    data?: {
        trackUnion?: SpotifyTrackData;
    };
}

export interface SpotifyTrackDetails {
    spotifyUrl: string;
    trackName: string;
    albumName: string;
    artistName: string;
    primaryArtistName: string;
    imageUrl: string;
    releaseDate: string;
}

export interface SpotifySearchTrackItem {
    item: {
        data: {
            __typename: string;
            uri: string;
            id: string;
            name: string;
            albumOfTrack: {
                uri: string;
                name: string;
                id: string;
                coverArt: {
                    sources: Array<{
                        url: string;
                        width: number;
                        height: number;
                    }>;
                };
            };
            artists: {
                items: Array<{
                    uri: string;
                    profile: {
                        name: string;
                    };
                }>;
            };
        };
    };
}

export interface SpotifySearchTracksResponse {
    data: {
        searchV2: {
            tracksV2: {
                items: SpotifySearchTrackItem[];
            };
        };
    };
}

export interface SpotifyClient {
    getAlbum(id: string): Promise<SpotifyAlbumResponse>;
    searchAlbums(terms: string, limit?: number): Promise<SpotifySearchAlbumsResponse>;
    getTrack(id: string): Promise<SpotifyTrackResponse>;
    searchTracks(terms: string, limit?: number): Promise<SpotifySearchTracksResponse>;
}
