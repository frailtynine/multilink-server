"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const Bandcamp_1 = require("../../src/features/Bandcamp");
const bandcampAlbum = {
    type: 'album',
    name: 'Graceful',
    url: 'https://touchgirlappleblossom.bandcamp.com/album/graceful',
    imageUrl: 'https://f4.bcbits.com/img/a0056180136_9.jpg',
    releaseDate: '15 May 2026 00:00:00 GMT',
    artist: {
        name: 'Touch Girl Apple Blossom',
        url: 'https://touchgirlappleblossom.bandcamp.com',
    },
};
(0, node_test_1.default)('normalizeBandcampReleaseDate converts Bandcamp dates to ISO format', () => {
    strict_1.default.equal((0, Bandcamp_1.normalizeBandcampReleaseDate)('15 May 2026 00:00:00 GMT'), '2026-05-15');
});
(0, node_test_1.default)('getBandcampAlbumDetails extracts the fields used by the app', () => {
    strict_1.default.deepEqual((0, Bandcamp_1.getBandcampAlbumDetails)(bandcampAlbum), {
        albumName: 'Graceful',
        artistName: 'Touch Girl Apple Blossom',
        primaryArtistName: 'Touch Girl Apple Blossom',
        imageUrl: 'https://f4.bcbits.com/img/a0056180136_9.jpg',
        releaseDate: '2026-05-15',
    });
});
(0, node_test_1.default)('composeBandcampSearchUrl composes a search URL with item_type=a', () => {
    strict_1.default.equal((0, Bandcamp_1.composeBandcampSearchUrl)('achers', 'bottom of the hill'), 'https://bandcamp.com/search?q=achers+bottom%2Bof%2Bthe%2Bhill&item_type=a');
});
const bandcampTrack = {
    type: 'track',
    name: 'Graceful (Title Track)',
    url: 'https://touchgirlappleblossom.bandcamp.com/track/graceful-title-track',
    imageUrl: 'https://f4.bcbits.com/img/a0056180136_9.jpg',
    releaseDate: '15 May 2026 00:00:00 GMT',
    artist: {
        name: 'Touch Girl Apple Blossom',
        url: 'https://touchgirlappleblossom.bandcamp.com',
    },
    album: {
        name: 'Graceful',
        url: 'https://touchgirlappleblossom.bandcamp.com/album/graceful',
        imageUrl: 'https://f4.bcbits.com/img/album-cover.jpg',
    },
};
const standaloneTrack = {
    type: 'track',
    name: 'Single Track',
    url: 'https://artist.bandcamp.com/track/single-track',
    imageUrl: 'https://f4.bcbits.com/img/single-cover.jpg',
    releaseDate: '01 Jan 2026 00:00:00 GMT',
    artist: {
        name: 'Solo Artist',
        url: 'https://artist.bandcamp.com',
    },
};
(0, node_test_1.default)('parseBandcampUrl accepts Bandcamp album URLs', () => {
    strict_1.default.equal((0, Bandcamp_1.parseBandcampUrl)('https://touchgirlappleblossom.bandcamp.com/album/graceful'), 'https://touchgirlappleblossom.bandcamp.com/album/graceful');
});
(0, node_test_1.default)('parseBandcampUrl accepts Bandcamp track URLs', () => {
    strict_1.default.equal((0, Bandcamp_1.parseBandcampUrl)('https://touchgirlappleblossom.bandcamp.com/track/graceful-title-track'), 'https://touchgirlappleblossom.bandcamp.com/track/graceful-title-track');
});
(0, node_test_1.default)('parseBandcampUrl rejects invalid Bandcamp URLs', () => {
    strict_1.default.throws(() => (0, Bandcamp_1.parseBandcampUrl)('https://touchgirlappleblossom.bandcamp.com/'), {
        message: 'Invalid Bandcamp URL',
    });
});
(0, node_test_1.default)('getBandcampUrlType returns track for track URLs', () => {
    strict_1.default.equal((0, Bandcamp_1.getBandcampUrlType)('https://touchgirlappleblossom.bandcamp.com/track/graceful-title-track'), 'track');
});
(0, node_test_1.default)('getBandcampUrlType returns album for album URLs', () => {
    strict_1.default.equal((0, Bandcamp_1.getBandcampUrlType)('https://touchgirlappleblossom.bandcamp.com/album/graceful'), 'album');
});
(0, node_test_1.default)('getBandcampTrackDetails extracts fields from a track with album', () => {
    strict_1.default.deepEqual((0, Bandcamp_1.getBandcampTrackDetails)(bandcampTrack), {
        albumName: 'Graceful',
        trackName: 'Graceful (Title Track)',
        artistName: 'Touch Girl Apple Blossom',
        primaryArtistName: 'Touch Girl Apple Blossom',
        imageUrl: 'https://f4.bcbits.com/img/a0056180136_9.jpg',
        releaseDate: '2026-05-15',
    });
});
(0, node_test_1.default)('getBandcampTrackDetails uses track name as albumName for standalone track', () => {
    const details = (0, Bandcamp_1.getBandcampTrackDetails)(standaloneTrack);
    strict_1.default.equal(details.albumName, 'Single Track');
    strict_1.default.equal(details.trackName, 'Single Track');
    strict_1.default.equal(details.primaryArtistName, 'Solo Artist');
});
