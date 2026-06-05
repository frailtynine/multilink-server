import assert from 'node:assert/strict';
import test from 'node:test';
import { Album, Track } from 'bandcamp-fetch';
import {
    composeBandcampSearchUrl,
    getBandcampAlbumDetails,
    getBandcampTrackDetails,
    getBandcampUrlType,
    normalizeBandcampReleaseDate,
    parseBandcampUrl,
} from '../../src/features/Bandcamp';

const bandcampAlbum: Album = {
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


test('normalizeBandcampReleaseDate converts Bandcamp dates to ISO format', () => {
    assert.equal(normalizeBandcampReleaseDate('15 May 2026 00:00:00 GMT'), '2026-05-15');
});

test('getBandcampAlbumDetails extracts the fields used by the app', () => {
    assert.deepEqual(getBandcampAlbumDetails(bandcampAlbum), {
        albumName: 'Graceful',
        artistName: 'Touch Girl Apple Blossom',
        primaryArtistName: 'Touch Girl Apple Blossom',
        imageUrl: 'https://f4.bcbits.com/img/a0056180136_9.jpg',
        releaseDate: '2026-05-15',
    });
});

test('composeBandcampSearchUrl composes a search URL with item_type=a', () => {
    assert.equal(
        composeBandcampSearchUrl('achers', 'bottom of the hill', 'album'),
        'https://bandcamp.com/search?q=achers+bottom%2Bof%2Bthe%2Bhill&item_type=a',
    );
});

const bandcampTrack: Track = {
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

const standaloneTrack: Track = {
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

test('parseBandcampUrl accepts Bandcamp album URLs', () => {
    assert.equal(
        parseBandcampUrl('https://touchgirlappleblossom.bandcamp.com/album/graceful'),
        'https://touchgirlappleblossom.bandcamp.com/album/graceful',
    );
});

test('parseBandcampUrl accepts Bandcamp track URLs', () => {
    assert.equal(
        parseBandcampUrl('https://touchgirlappleblossom.bandcamp.com/track/graceful-title-track'),
        'https://touchgirlappleblossom.bandcamp.com/track/graceful-title-track',
    );
});

test('parseBandcampUrl rejects invalid Bandcamp URLs', () => {
    assert.throws(() => parseBandcampUrl('https://touchgirlappleblossom.bandcamp.com/'), {
        message: 'Invalid Bandcamp URL',
    });
});

test('getBandcampUrlType returns track for track URLs', () => {
    assert.equal(
        getBandcampUrlType('https://touchgirlappleblossom.bandcamp.com/track/graceful-title-track'),
        'track',
    );
});

test('getBandcampUrlType returns album for album URLs', () => {
    assert.equal(
        getBandcampUrlType('https://touchgirlappleblossom.bandcamp.com/album/graceful'),
        'album',
    );
});

test('getBandcampTrackDetails extracts fields from a track with album', () => {
    assert.deepEqual(getBandcampTrackDetails(bandcampTrack), {
        albumName: 'Graceful',
        trackName: 'Graceful (Title Track)',
        artistName: 'Touch Girl Apple Blossom',
        primaryArtistName: 'Touch Girl Apple Blossom',
        imageUrl: 'https://f4.bcbits.com/img/a0056180136_9.jpg',
        releaseDate: '2026-05-15',
    });
});

test('getBandcampTrackDetails uses track name as albumName for standalone track', () => {
    const details = getBandcampTrackDetails(standaloneTrack);

    assert.equal(details.albumName, 'Single Track');
    assert.equal(details.trackName, 'Single Track');
    assert.equal(details.primaryArtistName, 'Solo Artist');
});
