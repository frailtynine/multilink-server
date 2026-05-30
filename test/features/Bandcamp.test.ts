import assert from 'node:assert/strict';
import test from 'node:test';
import { Album } from 'bandcamp-fetch';
import {
    composeBandcampSearchUrl,
    getBandcampAlbumDetails,
    normalizeBandcampReleaseDate,
    parseBandcampAlbumUrl,
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

test('parseBandcampAlbumUrl accepts Bandcamp album URLs', () => {
    assert.equal(
        parseBandcampAlbumUrl('https://touchgirlappleblossom.bandcamp.com/album/graceful'),
        'https://touchgirlappleblossom.bandcamp.com/album/graceful',
    );
});

test('parseBandcampAlbumUrl rejects non-album Bandcamp URLs', () => {
    assert.throws(() => parseBandcampAlbumUrl('https://touchgirlappleblossom.bandcamp.com/track/graceful'), {
        message: 'Invalid Bandcamp URL',
    });
});

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
        composeBandcampSearchUrl('achers', 'bottom of the hill'),
        'https://bandcamp.com/search?q=achers+bottom%2Bof%2Bthe%2Bhill&item_type=a',
    );
});
