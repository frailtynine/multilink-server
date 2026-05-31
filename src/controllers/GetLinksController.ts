import { AppleMusicFinder } from '../features/AppleMusic';
import {
    BandcampAlbumDetails,
    composeBandcampSearchUrl,
    getBandcampAlbumDetailsFromUrl,
    parseBandcampAlbumUrl,
} from '../features/Bandcamp';
import { findSpotifyAlbumUrl, getSpotifyAlbumDetails, getSpotifyData, parseSpotifyId } from '../features/Spotify';
import { getLogger } from '../logging/logger';
import { ErrorResponse, GetLinksResponse } from '../types/api';
import getTidalUrl from '../features/Tidal';
import { Get, Query, Res, Response, Route, SuccessResponse, Tags, TsoaResponse, Security } from 'tsoa';
import getDeezerData from '../features/Deezer';

type InputAlbumDetails = ReturnType<typeof getSpotifyAlbumDetails> | BandcampAlbumDetails;

function getUrlSource(url: string): 'spotify' | 'bandcamp' {
    try {
        parseSpotifyId(url);
        return 'spotify';
    } catch {
        parseBandcampAlbumUrl(url);
        return 'bandcamp';
    }
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

        let albumDetails: InputAlbumDetails;
        let spotifyUrl: string | undefined;
        let bandcampUrl: string | undefined;
        let inputSource: 'spotify' | 'bandcamp';
        try {
            inputSource = getUrlSource(url);
        } catch {
            return badRequestResponse(400, { message: 'Invalid URL. Expected a Spotify or Bandcamp album URL' });
        }

        if (inputSource === 'spotify') {
            try {
                const spotifyAlbumDetails = getSpotifyAlbumDetails(await getSpotifyData(url));
                albumDetails = spotifyAlbumDetails;
                spotifyUrl = spotifyAlbumDetails.spotifyUrl;
            } catch (error) {
                this.logger.error('Failed to fetch album from Spotify', { error, inputUrl: url });
                return serverErrorResponse(500, { message: 'Failed to fetch album from Spotify' });
            }
        } else {
            try {
                albumDetails = await getBandcampAlbumDetailsFromUrl(url);
                bandcampUrl = url;
            } catch (error) {
                this.logger.error('Failed to fetch album from Bandcamp', { error, inputUrl: url });
                return serverErrorResponse(500, { message: 'Failed to fetch album from Bandcamp' });
            }

            try {
                spotifyUrl = await findSpotifyAlbumUrl(
                    albumDetails.albumName,
                    albumDetails.primaryArtistName,
                    albumDetails.releaseDate,
                );
            } catch (error) {
                this.logger.error('Failed to find album on Spotify from Bandcamp data', {
                    error,
                    albumName: albumDetails.albumName,
                    artistName: albumDetails.primaryArtistName,
                    releaseDate: albumDetails.releaseDate,
                });
            }
        }

        if (!bandcampUrl) {
            bandcampUrl = composeBandcampSearchUrl(albumDetails.primaryArtistName, albumDetails.albumName);
        }

        let appleMusicUrl: string | undefined;
        try {
            appleMusicUrl = await AppleMusicFinder(
                albumDetails.albumName,
                albumDetails.primaryArtistName,
                albumDetails.releaseDate,
            );
        } catch (error) {
            this.logger.error('Failed to fetch album link from Apple Music', {
                error,
                albumName: albumDetails.albumName,
                artistName: albumDetails.primaryArtistName,
                releaseDate: albumDetails.releaseDate,
            });
        }

        let deezerUrl: string | undefined;
        try {
            deezerUrl = await getDeezerData(
                albumDetails.albumName,
                albumDetails.primaryArtistName,
            );
        } catch (error) {
            this.logger.error('Failed to fetch album link from Deezer', {
                error,
                albumName: albumDetails.albumName,
                artistName: albumDetails.primaryArtistName,
            });
        }

        let tidalUrl: string | undefined;
        try {
            tidalUrl = await getTidalUrl(
                albumDetails.albumName,
                albumDetails.primaryArtistName,
                albumDetails.releaseDate,
            );
        } catch (error) {
            this.logger.error('Failed to fetch album link from Tidal', {
                error,
                albumName: albumDetails.albumName,
                artistName: albumDetails.primaryArtistName,
                releaseDate: albumDetails.releaseDate,
            });
        }

        return {
            spotifyUrl,
            bandcampUrl,
            appleMusicUrl,
            deezerUrl,
            tidalUrl,
            imageUrl: albumDetails.imageUrl,
            albumName: albumDetails.albumName,
            artistName: albumDetails.artistName,
        };
    }
}
