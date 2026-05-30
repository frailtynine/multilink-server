"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const albumMatching_1 = require("../../src/utils/albumMatching");
(0, node_test_1.default)('findMatchingAlbum returns a candidate when album and artist contain query text', () => {
    const match = (0, albumMatching_1.findMatchingAlbum)({
        albums: [
            {
                albumName: 'Bottom of the Hill (Deluxe Edition)',
                artistName: 'Achers, Guest Vocalist',
                releaseDate: '2026-05-02',
            },
        ],
        requestedAlbumName: 'Bottom of the Hill',
        requestedArtistName: 'Achers',
        requestedReleaseDate: '2026-05-01',
        getAlbumName: (album) => album.albumName,
        getArtistName: (album) => album.artistName,
        getReleaseDate: (album) => album.releaseDate,
    });
    strict_1.default.equal(match?.albumName, 'Bottom of the Hill (Deluxe Edition)');
});
(0, node_test_1.default)('findMatchingAlbum returns undefined when no textual match exists', () => {
    const match = (0, albumMatching_1.findMatchingAlbum)({
        albums: [
            {
                albumName: 'Another Record',
                artistName: 'Different Artist',
                releaseDate: '2026-05-01',
            },
        ],
        requestedAlbumName: 'Bottom of the Hill',
        requestedArtistName: 'Achers',
        requestedReleaseDate: '2026-05-01',
        getAlbumName: (album) => album.albumName,
        getArtistName: (album) => album.artistName,
        getReleaseDate: (album) => album.releaseDate,
    });
    strict_1.default.equal(match, undefined);
});
(0, node_test_1.default)('findMatchingAlbum enforces release date window when required', () => {
    const match = (0, albumMatching_1.findMatchingAlbum)({
        albums: [
            {
                albumName: 'Bottom of the Hill',
                artistName: 'Achers',
                releaseDate: '2026-05-11',
            },
        ],
        requestedAlbumName: 'Bottom of the Hill',
        requestedArtistName: 'Achers',
        requestedReleaseDate: '2026-05-01',
        getAlbumName: (album) => album.albumName,
        getArtistName: (album) => album.artistName,
        getReleaseDate: (album) => album.releaseDate,
        requireReleaseDateMatch: true,
    });
    strict_1.default.equal(match, undefined);
});
(0, node_test_1.default)('findMatchingAlbum accepts full dates within seven days', () => {
    const match = (0, albumMatching_1.findMatchingAlbum)({
        albums: [
            {
                albumName: 'Bottom of the Hill',
                artistName: 'Achers',
                releaseDate: '2026-05-06',
            },
        ],
        requestedAlbumName: 'Bottom of the Hill',
        requestedArtistName: 'Achers',
        requestedReleaseDate: '2026-05-01',
        getAlbumName: (album) => album.albumName,
        getArtistName: (album) => album.artistName,
        getReleaseDate: (album) => album.releaseDate,
        requireReleaseDateMatch: true,
    });
    strict_1.default.equal(match?.releaseDate, '2026-05-06');
});
(0, node_test_1.default)('findMatchingAlbum supports album-only matching when artist is unavailable', () => {
    const match = (0, albumMatching_1.findMatchingAlbum)({
        albums: [
            {
                albumName: 'Bottom of the Hill',
                releaseDate: '2026-05-01',
            },
        ],
        requestedAlbumName: 'Bottom of the Hill (Deluxe)',
        requestedReleaseDate: '2026-05-01',
        getAlbumName: (album) => album.albumName,
        getReleaseDate: (album) => album.releaseDate,
    });
    strict_1.default.equal(match?.albumName, 'Bottom of the Hill');
});
