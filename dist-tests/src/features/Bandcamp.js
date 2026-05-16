"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBandcampAlbumUrl = parseBandcampAlbumUrl;
exports.normalizeBandcampReleaseDate = normalizeBandcampReleaseDate;
exports.getBandcampAlbumDetails = getBandcampAlbumDetails;
exports.getBandcampAlbumData = getBandcampAlbumData;
exports.getBandcampAlbumDetailsFromUrl = getBandcampAlbumDetailsFromUrl;
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
function parseBandcampAlbumUrl(bandcampUrl) {
    const { hostname, pathname } = new URL(bandcampUrl);
    if (hostname !== 'bandcamp.com' && !hostname.endsWith('.bandcamp.com')) {
        throw new Error('Invalid Bandcamp URL');
    }
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments[0] !== 'album' || !pathSegments[1]) {
        throw new Error('Invalid Bandcamp URL');
    }
    return bandcampUrl;
}
function normalizeBandcampReleaseDate(releaseDate) {
    if (!releaseDate) {
        return undefined;
    }
    const timestamp = Date.parse(releaseDate);
    if (Number.isNaN(timestamp)) {
        return undefined;
    }
    return new Date(timestamp).toISOString().slice(0, 10);
}
function getBandcampAlbumDetails(album) {
    const primaryArtistName = album.artist?.name?.trim();
    if (!primaryArtistName) {
        throw new Error('Bandcamp album is missing artists');
    }
    return {
        albumName: album.name,
        artistName: primaryArtistName,
        primaryArtistName,
        imageUrl: album.imageUrl ?? '',
        releaseDate: normalizeBandcampReleaseDate(album.releaseDate),
    };
}
async function getBandcampAlbumData(bandcampUrl) {
    return bandcamp_fetch_1.default.album.getInfo({
        albumUrl: parseBandcampAlbumUrl(bandcampUrl),
    });
}
async function getBandcampAlbumDetailsFromUrl(bandcampUrl) {
    return getBandcampAlbumDetails(await getBandcampAlbumData(bandcampUrl));
}
