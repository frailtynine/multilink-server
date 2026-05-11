import { AppleMusicFinder } from '../features/AppleMusic';
import { getSpotifyAlbumDetails, getSpotifyData } from '../features/Spotify';
import { ErrorResponse, GetLinksResponse } from '../types/api';
import getTidalUrl from '../features/Tidal';
import { Get, Query, Res, Response, Route, SuccessResponse, Tags, TsoaResponse, Security } from 'tsoa';
import getDeezerData from '../features/Deezer';

@Route('get_links')
@Tags('Get links')
export class GetLinksController {
    @Get()
    @Security('api_token')
    @SuccessResponse('200', 'OK')
    @Response<ErrorResponse>(400, 'Bad Request')
    @Response<ErrorResponse>(500, 'Internal Server Error')
    public async getAlbum(
        @Query() spotifyUrl: string,
        @Res() badRequestResponse: TsoaResponse<400, ErrorResponse>,
        @Res() serverErrorResponse: TsoaResponse<500, ErrorResponse>,
    ): Promise<GetLinksResponse | ErrorResponse>  {
        let spotifyAlbumDetails: ReturnType<typeof getSpotifyAlbumDetails>;
        try {
            spotifyAlbumDetails = getSpotifyAlbumDetails(await getSpotifyData(spotifyUrl));
        } catch (error) {
            if (error instanceof Error && error.message === 'Invalid Spotify URL') {
                return badRequestResponse(400, { message: 'Invalid Spotify URL' });
            }

            console.error('Failed to fetch album from Spotify', error);
            return serverErrorResponse(500, { message: 'Failed to fetch album from Spotify' });
        }

        let appleMusicUrl: string | undefined;
        try {
            appleMusicUrl = await AppleMusicFinder(
                spotifyAlbumDetails.albumName,
                spotifyAlbumDetails.primaryArtistName,
                spotifyAlbumDetails.releaseDate,
            );
        } catch (error) {
            console.error('Failed to fetch album link from Apple Music', error);
        }

        let deezerUrl: string | undefined;
        try {
            deezerUrl = await getDeezerData(
                spotifyAlbumDetails.albumName,
                spotifyAlbumDetails.primaryArtistName,
            );
        } catch (error) {
            console.error('Failed to fetch album link from Deezer', error);
        }

        let tidalUrl: string | undefined;
        try {
            tidalUrl = await getTidalUrl(
                spotifyAlbumDetails.albumName,
                spotifyAlbumDetails.primaryArtistName,
                spotifyAlbumDetails.releaseDate,
            );
        } catch (error) {
            console.error('Failed to fetch album link from Tidal', error);
        }
        return {
            spotifyUrl: spotifyAlbumDetails.spotifyUrl,
            appleMusicUrl,
            deezerUrl,
            tidalUrl,
            imageUrl: spotifyAlbumDetails.imageUrl,
            albumName: spotifyAlbumDetails.albumName,
            artistName: spotifyAlbumDetails.artistName,
        };
    }
}
