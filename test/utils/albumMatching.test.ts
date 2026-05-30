import assert from 'node:assert/strict';
import test from 'node:test';
import { findMatchingAlbum } from '../../src/utils/albumMatching';

interface CandidateAlbum {
    albumName?: string;
    artistName?: string;
    releaseDate?: string;
}

test('findMatchingAlbum returns a candidate when album and artist contain query text', () => {
    const match = findMatchingAlbum<CandidateAlbum>({
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

    assert.equal(match?.albumName, 'Bottom of the Hill (Deluxe Edition)');
});

test('findMatchingAlbum returns undefined when no textual match exists', () => {
    const match = findMatchingAlbum<CandidateAlbum>({
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

    assert.equal(match, undefined);
});

test('findMatchingAlbum enforces release date window when required', () => {
    const match = findMatchingAlbum<CandidateAlbum>({
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

    assert.equal(match, undefined);
});

test('findMatchingAlbum accepts full dates within seven days', () => {
    const match = findMatchingAlbum<CandidateAlbum>({
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

    assert.equal(match?.releaseDate, '2026-05-06');
});

test('findMatchingAlbum supports album-only matching when artist is unavailable', () => {
    const match = findMatchingAlbum<CandidateAlbum>({
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

    assert.equal(match?.albumName, 'Bottom of the Hill');
});
