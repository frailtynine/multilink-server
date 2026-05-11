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
const Spotify_1 = require("../features/Spotify");
const Tidal_1 = __importDefault(require("../features/Tidal"));
const tsoa_1 = require("tsoa");
const Deezer_1 = __importDefault(require("../features/Deezer"));
let GetLinksController = class GetLinksController {
    async getAlbum(spotifyUrl, badRequestResponse, serverErrorResponse) {
        let spotifyAlbumDetails;
        try {
            spotifyAlbumDetails = (0, Spotify_1.getSpotifyAlbumDetails)(await (0, Spotify_1.getSpotifyData)(spotifyUrl));
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Invalid Spotify URL') {
                return badRequestResponse(400, { message: 'Invalid Spotify URL' });
            }
            console.error('Failed to fetch album from Spotify', error);
            return serverErrorResponse(500, { message: 'Failed to fetch album from Spotify' });
        }
        let appleMusicUrl;
        try {
            appleMusicUrl = await (0, AppleMusic_1.AppleMusicFinder)(spotifyAlbumDetails.albumName, spotifyAlbumDetails.primaryArtistName, spotifyAlbumDetails.releaseDate);
        }
        catch (error) {
            console.error('Failed to fetch album link from Apple Music', error);
        }
        let deezerUrl;
        try {
            deezerUrl = await (0, Deezer_1.default)(spotifyAlbumDetails.albumName, spotifyAlbumDetails.primaryArtistName);
        }
        catch (error) {
            console.error('Failed to fetch album link from Deezer', error);
        }
        let tidalUrl;
        try {
            tidalUrl = await (0, Tidal_1.default)(spotifyAlbumDetails.albumName, spotifyAlbumDetails.primaryArtistName, spotifyAlbumDetails.releaseDate);
        }
        catch (error) {
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
};
exports.GetLinksController = GetLinksController;
__decorate([
    (0, tsoa_1.Get)(),
    (0, tsoa_1.SuccessResponse)('200', 'OK'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    (0, tsoa_1.Response)(500, 'Internal Server Error'),
    __param(0, (0, tsoa_1.Query)()),
    __param(1, (0, tsoa_1.Res)()),
    __param(2, (0, tsoa_1.Res)())
], GetLinksController.prototype, "getAlbum", null);
exports.GetLinksController = GetLinksController = __decorate([
    (0, tsoa_1.Route)('get_links'),
    (0, tsoa_1.Tags)('Get links')
], GetLinksController);
