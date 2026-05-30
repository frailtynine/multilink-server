import { AppleMusicFinder } from '../features/AppleMusic';
import {
    BandcampAlbumDetails,
    composeBandcampSearchUrl,
    getBandcampAlbumDetailsFromUrl,
    getBandcampTrackDetailsFromUrl,
    getBandcampUrlType,
    parseBandcampUrl,
} from '../features/Bandcamp';
import {
    findSpotifyAlbumUrl,
    findSpotifyTrackUrl,
    getSpotifyAlbumDetails,
    getSpotifyData,
    getSpotifyTrackData,
    getSpotifyTrackDetails,
    parseSpotifyId,
    parseSpotifyTrackId,
} from '../features/Spotify';
import { getLogger } from '../logging/logger';
import { ErrorResponse, GetLinksResponse } from '../types/api';
import getTidalUrl from '../features/Tidal';
import { Get, Query, Res, Response, Route, SuccessResponse, Tags, TsoaResponse, Security } from 'tsoa';
import getDeezerData from '../features/Deezer';

type InputItemDetails = (ReturnType<typeof getSpotifyAlbumDetails> | BandcampAlbumDetails) & {
    itemType: 'album' | 'track';
};

function getUrlSource(url: string): { source: 'spotify' | 'bandcamp'; itemType: 'album' | 'track' } {
    try {
        parseSpotifyTrackId(url);
        return { source: 'spotify', itemType: 'track' };
    } catch {
    }

    try {
        parseSpotifyId(url);
        return { source: 'spotify', itemType: 'album' };
    } catch {
    }

    parseBandcampUrl(url);
    const itemType = getBandcampUrlType(url);

    return { source: 'bandcamp', itemType };
}

@Route('get_links')
@Tags('Get links')
export class GetLinksController {
    private readonly logger = getLogger('get-links-controller');

    @Get()
    @Security('api_token')
    @SuccessResponse('200', 'OK')
    @Response<ErrorResponse>(400, 'Bad Request')
    @Response<ErrorResponse>(500, 'Internal Server Error')
    public async getAlbum(
        @Res() badRequestResponse: TsoaResponse<400, ErrorResponse>,
        @Res() serverErrorResponse: TsoaResponse<500, ErrorResponse>,
        @Query() url?: string,
    ): Promise<GetLinksResponse | ErrorResponse>  {
        if (!url) {
            return badRequestResponse(400, { message: 'Missing input URL' });
        }

        let itemDetails: InputItemDetails;
        let spotifyUrl: string | undefined;
        let bandcampUrl: string | undefined;
        let inputSource: 'spotify' | 'bandcamp';
        let itemType: 'album' | 'track';
        try {
            const sourceResult = getUrlSource(url);
            inputSource = sourceResult.source;
            itemType = sourceResult.itemType;
        } catch {
            return badRequestResponse(400, { message: 'Invalid URL. Expected a Spotify or Bandcamp album or track URL' });
        }

        if (inputSource === 'spotify') {
            if (itemType === 'track') {
                try {
                    const trackDetails = getSpotifyTrackDetails(await getSpotifyTrackData(url));
                    itemDetails = {
                        albumName: trackDetails.trackName,
                        artistName: trackDetails.artistName,
                        primaryArtistName: trackDetails.primaryArtistName,
                        imageUrl: trackDetails.imageUrl,
                        releaseDate: trackDetails.releaseDate,
                        itemType: 'track',
                    };
                    spotifyUrl = trackDetails.spotifyUrl;
                } catch (error) {
                    this.logger.error('Failed to fetch track from Spotify', { error, inputUrl: url });
                    return serverErrorResponse(500, { message: 'Failed to fetch track from Spotify' });
                }
            } else {
                try {
                    const spotifyAlbumDetails = getSpotifyAlbumDetails(await getSpotifyData(url));
                    itemDetails = {
                        ...spotifyAlbumDetails,
                        itemType: 'album',
                    };
                    spotifyUrl = spotifyAlbumDetails.spotifyUrl;
                } catch (error) {
                    this.logger.error('Failed to fetch album from Spotify', { error, inputUrl: url });
                    return serverErrorResponse(500, { message: 'Failed to fetch album from Spotify' });
                }
            }
        } else {
            bandcampUrl = url;
            if (itemType === 'track') {
                try {
                    const trackDetails = await getBandcampTrackDetailsFromUrl(url);
                    itemDetails = {
                        albumName: trackDetails.trackName,
                        artistName: trackDetails.artistName,
                        primaryArtistName: trackDetails.primaryArtistName,
                        imageUrl: trackDetails.imageUrl,
                        releaseDate: trackDetails.releaseDate,
                        itemType: 'track',
                    };
                } catch (error) {
                    this.logger.error('Failed to fetch track from Bandcamp', { error, inputUrl: url });
                    return serverErrorResponse(500, { message: 'Failed to fetch track from Bandcamp' });
                }

                try {
                    spotifyUrl = await findSpotifyTrackUrl(
                        itemDetails.albumName,
                        itemDetails.primaryArtistName,
                    );
                } catch (error) {
                    this.logger.error('Failed to find track on Spotify from Bandcamp data', {
                        error,
                        trackName: itemDetails.albumName,
                        artistName: itemDetails.primaryArtistName,
                    });
                }
            } else {
                try {
                    const bandcampDetails = await getBandcampAlbumDetailsFromUrl(url);
                    itemDetails = {
                        ...bandcampDetails,
                        itemType: 'album',
                    };
                } catch (error) {
                    this.logger.error('Failed to fetch album from Bandcamp', { error, inputUrl: url });
                    return serverErrorResponse(500, { message: 'Failed to fetch album from Bandcamp' });
                }

                try {
                    spotifyUrl = await findSpotifyAlbumUrl(
                        itemDetails.albumName,
                        itemDetails.primaryArtistName,
                        itemDetails.releaseDate,
                    );
                } catch (error) {
                    this.logger.error('Failed to find album on Spotify from Bandcamp data', {
                        error,
                        albumName: itemDetails.albumName,
                        artistName: itemDetails.primaryArtistName,
                        releaseDate: itemDetails.releaseDate,
                    });
                }
            }
        }

        if (!bandcampUrl) {
            bandcampUrl = composeBandcampSearchUrl(itemDetails.primaryArtistName, itemDetails.albumName);
        }

        let appleMusicUrl: string | undefined;
        try {
            appleMusicUrl = await AppleMusicFinder(
                itemDetails.albumName,
                itemDetails.primaryArtistName,
                itemDetails.releaseDate,
                undefined,
                itemDetails.itemType,
            );
        } catch (error) {
            this.logger.error('Failed to fetch link from Apple Music', {
                error,
                albumName: itemDetails.albumName,
                artistName: itemDetails.primaryArtistName,
                releaseDate: itemDetails.releaseDate,
                itemType: itemDetails.itemType,
            });
        }

        let deezerUrl: string | undefined;
        try {
            deezerUrl = await getDeezerData(
                itemDetails.albumName,
                itemDetails.primaryArtistName,
                itemDetails.itemType,
            );
        } catch (error) {
            this.logger.error('Failed to fetch link from Deezer', {
                error,
                albumName: itemDetails.albumName,
                artistName: itemDetails.primaryArtistName,
                itemType: itemDetails.itemType,
            });
        }

        let tidalUrl: string | undefined;
        try {
            tidalUrl = await getTidalUrl(
                itemDetails.albumName,
                itemDetails.primaryArtistName,
                itemDetails.releaseDate,
                itemDetails.itemType,
            );
        } catch (error) {
            this.logger.error('Failed to fetch link from Tidal', {
                error,
                albumName: itemDetails.albumName,
                artistName: itemDetails.primaryArtistName,
                releaseDate: itemDetails.releaseDate,
                itemType: itemDetails.itemType,
            });
        }

        return {
            spotifyUrl,
            bandcampUrl,
            appleMusicUrl,
            deezerUrl,
            tidalUrl,
            imageUrl: itemDetails.imageUrl,
            albumName: itemDetails.albumName,
            artistName: itemDetails.artistName,
            itemType: itemDetails.itemType,
        };
    }
}
