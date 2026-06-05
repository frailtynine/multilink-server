"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLinksController = void 0;
const AppleMusic_1 = require("../features/AppleMusic");
const Bandcamp_1 = require("../features/Bandcamp");
const Spotify_1 = require("../features/Spotify");
const logger_1 = require("../logging/logger");
const Tidal_1 = __importDefault(require("../features/Tidal"));
const tsoa_1 = require("tsoa");
const Deezer_1 = __importDefault(require("../features/Deezer"));
const getLinksQueue_1 = require("../utils/getLinksQueue");
function getUrlSource(url) {
    try {
        (0, Spotify_1.parseSpotifyTrackId)(url);
        return { source: 'spotify', itemType: 'track' };
    }
    catch {
    }
    try {
        (0, Spotify_1.parseSpotifyId)(url);
        return { source: 'spotify', itemType: 'album' };
    }
    catch {
    }
    (0, Bandcamp_1.parseBandcampUrl)(url);
    const itemType = (0, Bandcamp_1.getBandcampUrlType)(url);
    return { source: 'bandcamp', itemType };
}
let GetLinksController = class GetLinksController {
    constructor() {
        this.logger = (0, logger_1.getLogger)('get-links-controller');
    }
    async getAlbum(badRequestResponse, tooManyRequestsResponse, serverErrorResponse, url) {
        if (!url) {
            return badRequestResponse(400, { message: 'Missing input URL' });
        }
        try {
            return await (0, getLinksQueue_1.scheduleGetLinksRequest)(async () => {
                let itemDetails;
                let spotifyUrl;
                let bandcampUrl;
                let inputSource;
                let itemType;
                try {
                    const sourceResult = getUrlSource(url);
                    inputSource = sourceResult.source;
                    itemType = sourceResult.itemType;
                }
                catch {
                    return badRequestResponse(400, { message: 'Invalid URL. Expected a Spotify or Bandcamp album or track URL' });
                }
                if (inputSource === 'spotify') {
                    if (itemType === 'track') {
                        try {
                            const trackDetails = (0, Spotify_1.getSpotifyTrackDetails)(await (0, Spotify_1.getSpotifyTrackData)(url));
                            itemDetails = {
                                albumName: trackDetails.trackName,
                                artistName: trackDetails.artistName,
                                primaryArtistName: trackDetails.primaryArtistName,
                                imageUrl: trackDetails.imageUrl,
                                releaseDate: trackDetails.releaseDate,
                                itemType: 'track',
                            };
                            spotifyUrl = trackDetails.spotifyUrl;
                        }
                        catch (error) {
                            this.logger.error('Failed to fetch track from Spotify', { error, inputUrl: url });
                            return serverErrorResponse(500, { message: 'Failed to fetch track from Spotify' });
                        }
                    }
                    else {
                        try {
                            const spotifyAlbumDetails = (0, Spotify_1.getSpotifyAlbumDetails)(await (0, Spotify_1.getSpotifyData)(url));
                            itemDetails = {
                                ...spotifyAlbumDetails,
                                itemType: 'album',
                            };
                            spotifyUrl = spotifyAlbumDetails.spotifyUrl;
                        }
                        catch (error) {
                            this.logger.error('Failed to fetch album from Spotify', { error, inputUrl: url });
                            return serverErrorResponse(500, { message: 'Failed to fetch album from Spotify' });
                        }
                    }
                }
                else {
                    bandcampUrl = url;
                    if (itemType === 'track') {
                        try {
                            const trackDetails = await (0, Bandcamp_1.getBandcampTrackDetailsFromUrl)(url);
                            itemDetails = {
                                albumName: trackDetails.trackName,
                                artistName: trackDetails.artistName,
                                primaryArtistName: trackDetails.primaryArtistName,
                                imageUrl: trackDetails.imageUrl,
                                releaseDate: trackDetails.releaseDate,
                                itemType: 'track',
                            };
                        }
                        catch (error) {
                            this.logger.error('Failed to fetch track from Bandcamp', { error, inputUrl: url });
                            return serverErrorResponse(500, { message: 'Failed to fetch track from Bandcamp' });
                        }
                        try {
                            spotifyUrl = await (0, Spotify_1.findSpotifyTrackUrl)(itemDetails.albumName, itemDetails.primaryArtistName);
                        }
                        catch (error) {
                            this.logger.error('Failed to find track on Spotify from Bandcamp data', {
                                error,
                                trackName: itemDetails.albumName,
                                artistName: itemDetails.primaryArtistName,
                            });
                        }
                    }
                    else {
                        try {
                            const bandcampDetails = await (0, Bandcamp_1.getBandcampAlbumDetailsFromUrl)(url);
                            itemDetails = {
                                ...bandcampDetails,
                                itemType: 'album',
                            };
                        }
                        catch (error) {
                            this.logger.error('Failed to fetch album from Bandcamp', { error, inputUrl: url });
                            return serverErrorResponse(500, { message: 'Failed to fetch album from Bandcamp' });
                        }
                        try {
                            spotifyUrl = await (0, Spotify_1.findSpotifyAlbumUrl)(itemDetails.albumName, itemDetails.primaryArtistName, itemDetails.releaseDate);
                        }
                        catch (error) {
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
                    bandcampUrl = (0, Bandcamp_1.composeBandcampSearchUrl)(itemDetails.primaryArtistName, itemDetails.albumName, itemDetails.itemType);
                }
                let appleMusicUrl;
                try {
                    appleMusicUrl = await (0, AppleMusic_1.AppleMusicFinder)(itemDetails.albumName, itemDetails.primaryArtistName, itemDetails.releaseDate, undefined, itemDetails.itemType);
                }
                catch (error) {
                    this.logger.error('Failed to fetch link from Apple Music', {
                        error,
                        albumName: itemDetails.albumName,
                        artistName: itemDetails.primaryArtistName,
                        releaseDate: itemDetails.releaseDate,
                        itemType: itemDetails.itemType,
                    });
                }
                let deezerUrl;
                try {
                    deezerUrl = await (0, Deezer_1.default)(itemDetails.albumName, itemDetails.primaryArtistName, itemDetails.itemType);
                }
                catch (error) {
                    this.logger.error('Failed to fetch link from Deezer', {
                        error,
                        albumName: itemDetails.albumName,
                        artistName: itemDetails.primaryArtistName,
                        itemType: itemDetails.itemType,
                    });
                }
                let tidalUrl;
                try {
                    tidalUrl = await (0, Tidal_1.default)(itemDetails.albumName, itemDetails.primaryArtistName, itemDetails.releaseDate, itemDetails.itemType);
                }
                catch (error) {
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
        }
        catch (error) {
            if (error instanceof getLinksQueue_1.GetLinksQueueTimeoutError) {
                this.logger.warn('Get links request timed out', { inputUrl: url });
                return tooManyRequestsResponse(429, { message: 'Too many requests. Please try again later.' });
            }
            this.logger.error('Failed to process get links request', { error, inputUrl: url });
            return serverErrorResponse(500, { message: 'Failed to process request' });
        }
    }
};
exports.GetLinksController = GetLinksController;
__decorate([
    (0, tsoa_1.Get)(),
    (0, tsoa_1.Security)('api_token'),
    (0, tsoa_1.SuccessResponse)('200', 'OK'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    (0, tsoa_1.Response)(429, 'Too Many Requests'),
    (0, tsoa_1.Response)(500, 'Internal Server Error'),
    __param(0, (0, tsoa_1.Res)()),
    __param(1, (0, tsoa_1.Res)()),
    __param(2, (0, tsoa_1.Res)()),
    __param(3, (0, tsoa_1.Query)())
], GetLinksController.prototype, "getAlbum", null);
exports.GetLinksController = GetLinksController = __decorate([
    (0, tsoa_1.Route)('get_links'),
    (0, tsoa_1.Tags)('Get links')
], GetLinksController);
