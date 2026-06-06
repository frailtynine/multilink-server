import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createMetacriticAlbumUrl,
    getMetacriticAlbumMetascore,
} from '../../src/features/Metacritic';

test('createMetacriticAlbumUrl builds a canonical Metacritic music URL', () => {
    assert.equal(
        createMetacriticAlbumUrl('Bottom of the Hill', 'Achers'),
        'https://www.metacritic.com/music/bottom-of-the-hill/achers',
    );
});

test('createMetacriticAlbumUrl normalizes accents and punctuation', () => {
    assert.equal(
        createMetacriticAlbumUrl('À la carte!!!', 'Beyoncé Knowles'),
        'https://www.metacritic.com/music/a-la-carte/beyonce-knowles',
    );
});

test('createMetacriticAlbumUrl rejects empty slug values', () => {
    assert.throws(() => createMetacriticAlbumUrl('!!!', '???'), {
        message: 'Album name and band name must contain letters or numbers',
    });
});

test('getMetacriticAlbumMetascore returns undefined for 404 responses', async () => {
    const score = await getMetacriticAlbumMetascore(
        'Graceful',
        'Touch Girl Apple Blossom',
        async () => ({ status: 404, body: '' }),
    );

    assert.equal(score, undefined);
});

test('getMetacriticAlbumMetascore throws for non-404 error responses', async () => {
    await assert.rejects(
        () => getMetacriticAlbumMetascore('Graceful', 'Touch Girl Apple Blossom', async () => ({
            status: 403,
            body: '',
        })),
        {
            message: 'Failed to fetch Metacritic page: 403',
        },
    );
});

test('getMetacriticAlbumMetascore extracts score from aggregateRating JSON-LD', async () => {
    const score = await getMetacriticAlbumMetascore(
        'U',
        'Underscores',
        async () => ({
            status: 200,
            body: '<script type="application/ld+json">{"aggregateRating":{"ratingValue":"87"}}</script>',
        }),
    );

    assert.equal(score, 87);
});

test('getMetacriticAlbumMetascore prefers album summary rating over unrelated metascore_w blocks', async () => {
    const score = await getMetacriticAlbumMetascore(
        'An Eraser And A Maze',
        'Modest Mouse',
        async () => ({
            status: 200,
            body: [
                '<div class="metascore_w medium game positive">87</div>',
                '<div class="score_summary metascore_summary">',
                '<span itemprop="ratingValue">72</span>',
                '</div>',
            ].join(''),
        }),
    );

    assert.equal(score, 72);
});

test('getMetacriticAlbumMetascore falls back to metascore_w markup', async () => {
    const score = await getMetacriticAlbumMetascore(
        'U',
        'Underscores',
        async () => ({
            status: 200,
            body: '<span class="metascore_w xlarge">81</span>',
        }),
    );

    assert.equal(score, 81);
});

test('getMetacriticAlbumMetascore returns undefined when no valid score is present', async () => {
    const score = await getMetacriticAlbumMetascore(
        'U',
        'Underscores',
        async () => ({
            status: 200,
            body: '<html><body>No metascore here</body></html>',
        }),
    );

    assert.equal(score, undefined);
});
