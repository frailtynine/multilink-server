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
const AppleMusic_1 = require("../features/AppleMusic/AppleMusic");
const Bandcamp_1 = require("../features/Bandcamp");
const Spotify_1 = require("../features/Spotify");
const logger_1 = require("../logging/logger");
const Tidal_1 = __importDefault(require("../features/Tidal"));
const tsoa_1 = require("tsoa");
const Deezer_1 = __importDefault(require("../features/Deezer"));
const getLinksQueue_1 = require("../utils/getLinksQueue");
const InputResolver_1 = require("../features/InputResolver");
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
                let appleMusicUrl;
                let inputSource;
                let itemType;
                try {
                    const resolvedInput = await (0, InputResolver_1.resolveInputFromUrl)(url);
                    inputSource = resolvedInput.source;
                    itemType = resolvedInput.itemType;
                    itemDetails = resolvedInput.itemDetails;
                    spotifyUrl = resolvedInput.spotifyUrl;
                    bandcampUrl = resolvedInput.bandcampUrl;
                    appleMusicUrl = resolvedInput.appleMusicUrl;
                }
                catch (error) {
                    if (error instanceof InputResolver_1.InvalidInputUrlError) {
                        return badRequestResponse(400, { message: error.message });
                    }
                    this.logger.error('Failed to fetch item details from input URL', { error, inputUrl: url });
                    return serverErrorResponse(500, { message: 'Failed to fetch input item details' });
                }
                if (inputSource === 'spotify') {
                    if (itemType === 'track') {
                        try {
                            spotifyUrl = await (0, Spotify_1.findSpotifyTrackUrl)(itemDetails.albumName, itemDetails.primaryArtistName);
                        }
                        catch (error) {
                            this.logger.error('Failed to find track on Spotify from Spotify data', {
                                error,
                                trackName: itemDetails.albumName,
                                artistName: itemDetails.primaryArtistName,
                            });
                        }
                    }
                    else {
                        try {
                            spotifyUrl = await (0, Spotify_1.findSpotifyAlbumUrl)(itemDetails.albumName, itemDetails.primaryArtistName, itemDetails.releaseDate);
                        }
                        catch (error) {
                            this.logger.error('Failed to find album on Spotify from Spotify data', {
                                error,
                                albumName: itemDetails.albumName,
                                artistName: itemDetails.primaryArtistName,
                                releaseDate: itemDetails.releaseDate,
                            });
                        }
                    }
                }
                else if (inputSource === 'bandcamp') {
                    if (itemType === 'track') {
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
                else {
                    try {
                        if (itemType === 'track') {
                            spotifyUrl = await (0, Spotify_1.findSpotifyTrackUrl)(itemDetails.albumName, itemDetails.primaryArtistName);
                        }
                        else {
                            spotifyUrl = await (0, Spotify_1.findSpotifyAlbumUrl)(itemDetails.albumName, itemDetails.primaryArtistName, itemDetails.releaseDate);
                        }
                    }
                    catch (error) {
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
                    bandcampUrl = (0, Bandcamp_1.composeBandcampSearchUrl)(itemDetails.primaryArtistName, itemDetails.albumName, itemDetails.itemType);
                }
                if (!appleMusicUrl) {
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
