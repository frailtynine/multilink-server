import { AppleMusicFinder } from '../features/AppleMusic/AppleMusic';
import {
    composeBandcampSearchUrl,
} from '../features/Bandcamp';
import {
    findSpotifyAlbumUrl,
    findSpotifyTrackUrl,
} from '../features/Spotify';
import { getLogger } from '../logging/logger';
import { ErrorResponse, GetLinksResponse, ItemType } from '../types/api';
import getTidalUrl from '../features/Tidal';
import { Get, Query, Res, Response, Route, SuccessResponse, Tags, TsoaResponse, Security } from 'tsoa';
import getDeezerData from '../features/Deezer';
import { GetLinksQueueTimeoutError, scheduleGetLinksRequest } from '../utils/getLinksQueue';
import { InvalidInputUrlError, resolveInputFromUrl } from '../features/InputResolver';

@Route('get_links')
@Tags('Get links')
export class GetLinksController {
    private readonly logger = getLogger('get-links-controller');

    @Get()
    @Security('api_token')
    @SuccessResponse('200', 'OK')
    @Response<ErrorResponse>(400, 'Bad Request')
    @Response<ErrorResponse>(429, 'Too Many Requests')
    @Response<ErrorResponse>(500, 'Internal Server Error')
    public async getAlbum(
        @Res() badRequestResponse: TsoaResponse<400, ErrorResponse>,
        @Res() tooManyRequestsResponse: TsoaResponse<429, ErrorResponse>,
        @Res() serverErrorResponse: TsoaResponse<500, ErrorResponse>,
        @Query() url?: string,
    ): Promise<GetLinksResponse | ErrorResponse>  {
        if (!url) {
            return badRequestResponse(400, { message: 'Missing input URL' });
        }
        
        try {
            return await scheduleGetLinksRequest(async () => {

                let itemDetails: Awaited<ReturnType<typeof resolveInputFromUrl>>['itemDetails'];
                let spotifyUrl: string | undefined;
                let bandcampUrl: string | undefined;
                let appleMusicUrl: string | undefined;
                let inputSource: Awaited<ReturnType<typeof resolveInputFromUrl>>['source'];
                let itemType: ItemType;
                try {
                    const resolvedInput = await resolveInputFromUrl(url);
                    inputSource = resolvedInput.source;
                    itemType = resolvedInput.itemType;
                    itemDetails = resolvedInput.itemDetails;
                    spotifyUrl = resolvedInput.spotifyUrl;
                    bandcampUrl = resolvedInput.bandcampUrl;
                    appleMusicUrl = resolvedInput.appleMusicUrl;
                } catch (error) {
                    if (error instanceof InvalidInputUrlError) {
                        return badRequestResponse(400, { message: error.message });
                    }

                    this.logger.error('Failed to fetch item details from input URL', { error, inputUrl: url });
                    return serverErrorResponse(500, { message: 'Failed to fetch input item details' });
                }
        
                if (inputSource === 'spotify') {
                    if (itemType === 'track') {
                        try {
                            spotifyUrl = await findSpotifyTrackUrl(
                                itemDetails.albumName,
                                itemDetails.primaryArtistName,
                            );
                        } catch (error) {
                            this.logger.error('Failed to find track on Spotify from Spotify data', {
                                error,
                                trackName: itemDetails.albumName,
                                artistName: itemDetails.primaryArtistName,
                            });
                        }
                    } else {
                        try {
                            spotifyUrl = await findSpotifyAlbumUrl(
                                itemDetails.albumName,
                                itemDetails.primaryArtistName,
                                itemDetails.releaseDate,
                            );
                        } catch (error) {
                            this.logger.error('Failed to find album on Spotify from Spotify data', {
                                error,
                                albumName: itemDetails.albumName,
                                artistName: itemDetails.primaryArtistName,
                                releaseDate: itemDetails.releaseDate,
                            });
                        }
                    }
                } else if (inputSource === 'bandcamp') {
                    if (itemType === 'track') {
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
                } else {
                    try {
                        if (itemType === 'track') {
                            spotifyUrl = await findSpotifyTrackUrl(
                                itemDetails.albumName,
                                itemDetails.primaryArtistName,
                            );
                        } else {
                            spotifyUrl = await findSpotifyAlbumUrl(
                                itemDetails.albumName,
                                itemDetails.primaryArtistName,
                                itemDetails.releaseDate,
                            );
                        }
                    } catch (error) {
                        this.logger.error('Failed to find item on Spotify from Apple Music data', {
                            error,
                            albumName: itemDetails.albumName,
                            artistName: itemDetails.primaryArtistName,
                            releaseDate: itemDetails.releaseDate,
                            itemType: itemDetails.itemType,
                        });
                    }
                }
        
                if (!bandcampUrl) {
                    bandcampUrl = composeBandcampSearchUrl(itemDetails.primaryArtistName, itemDetails.albumName, itemDetails.itemType);
                }
        
                if (!appleMusicUrl) {
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
            });
        } catch (error) {
            if (error instanceof GetLinksQueueTimeoutError) {
                this.logger.warn('Get links request timed out', { inputUrl: url });
                return tooManyRequestsResponse(429, { message: 'Too many requests. Please try again later.' });
            }
            this.logger.error('Failed to process get links request', { error, inputUrl: url });
            return serverErrorResponse(500, { message: 'Failed to process request' });
        }
    }
}
