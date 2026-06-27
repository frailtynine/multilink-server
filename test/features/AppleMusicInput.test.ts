import assert from 'node:assert/strict';
import test from 'node:test';
import { getAppleMusicUrlType, parseAppleMusicUrl } from '../../src/features/AppleMusic/AppleMusicInput';

test('parseAppleMusicUrl parses album URL with storefront', () => {
    assert.deepEqual(
        parseAppleMusicUrl('https://music.apple.com/us/album/escapology/1634523850'),
        {
            storefront: 'us',
            itemType: 'album',
            resourceId: '1634523850',
        },
    );
});

test('parseAppleMusicUrl treats ?i as track and uses song id', () => {
    assert.deepEqual(
        parseAppleMusicUrl('https://music.apple.com/us/album/escapology/1634523850?i=1634523851'),
        {
            storefront: 'us',
            itemType: 'track',
            resourceId: '1634523851',
        },
    );
});

test('parseAppleMusicUrl parses direct song URL as track', () => {
    assert.deepEqual(
        parseAppleMusicUrl('https://music.apple.com/us/song/example-song/1634523851'),
        {
            storefront: 'us',
            itemType: 'track',
            resourceId: '1634523851',
        },
    );
});

test('parseAppleMusicUrl falls back to APPLE_MUSIC_REGION when storefront is missing', () => {
    const previousRegion = process.env.APPLE_MUSIC_REGION;
    process.env.APPLE_MUSIC_REGION = 'ru';

    try {
        assert.deepEqual(
            parseAppleMusicUrl('https://music.apple.com/album/escapology/1634523850'),
            {
                storefront: 'ru',
                itemType: 'album',
                resourceId: '1634523850',
            },
        );
    } finally {
        process.env.APPLE_MUSIC_REGION = previousRegion;
    }
});

test('getAppleMusicUrlType returns track for song URLs', () => {
    assert.equal(
        getAppleMusicUrlType('https://music.apple.com/us/song/example-song/1634523851'),
        'track',
    );
});

test('parseAppleMusicUrl rejects non-apple domains', () => {
    assert.throws(
        () => parseAppleMusicUrl('https://example.com/us/album/escapology/1634523850'),
        { message: 'Invalid Apple Music URL' },
    );
});

test('parseAppleMusicUrl rejects unsupported Apple Music resource types', () => {
    assert.throws(
        () => parseAppleMusicUrl('https://music.apple.com/us/playlist/favorites/pl.u-123456'),
        { message: 'Invalid Apple Music URL' },
    );
});

test('parseAppleMusicUrl rejects missing resource id', () => {
    assert.throws(
        () => parseAppleMusicUrl('https://music.apple.com/us/album/escapology/'),
        { message: 'Invalid Apple Music URL' },
    );
});
