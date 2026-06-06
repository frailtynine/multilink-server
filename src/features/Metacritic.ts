import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const METACRITIC_MUSIC_BASE_URL = 'https://www.metacritic.com/music';
const execFileAsync = promisify(execFile);

type MetacriticHtmlFetcher = (url: string) => Promise<{ status: number; body: string }>;

function slugifyMetacriticPathSegment(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function createMetacriticAlbumUrl(albumName: string, bandName: string): string {
    const albumSlug = slugifyMetacriticPathSegment(albumName);
    const bandSlug = slugifyMetacriticPathSegment(bandName);

    if (!albumSlug || !bandSlug) {
        throw new Error('Album name and band name must contain letters or numbers');
    }

    return `${METACRITIC_MUSIC_BASE_URL}/${albumSlug}/${bandSlug}`;
}

function extractMetascoreFromHtml(html: string): number | undefined {
    const albumSummaryMatch = html.match(/<div class="score_summary metascore_summary"[\s\S]*?<span itemprop="ratingValue">(\d{1,3})<\/span>/i);
    const albumSummaryScore = albumSummaryMatch?.[1] ? Number(albumSummaryMatch[1]) : Number.NaN;

    if (Number.isInteger(albumSummaryScore) && albumSummaryScore >= 0 && albumSummaryScore <= 100) {
        return albumSummaryScore;
    }

    const aggregateRatingMatch = html.match(/"aggregateRating"\s*:\s*\{[^}]*"ratingValue"\s*:\s*"?(\d{1,3})"?/s);
    const ldJsonScore = aggregateRatingMatch?.[1] ? Number(aggregateRatingMatch[1]) : Number.NaN;

    if (Number.isInteger(ldJsonScore) && ldJsonScore >= 0 && ldJsonScore <= 100) {
        return ldJsonScore;
    }

    const fallbackMatch = html.match(/metascore_w[^>]*>(\d{1,3})</i)
        ?? html.match(/c-siteReviewScore[^>]*>(\d{1,3})</i);
    const fallbackScore = fallbackMatch?.[1] ? Number(fallbackMatch[1]) : Number.NaN;

    if (Number.isInteger(fallbackScore) && fallbackScore >= 0 && fallbackScore <= 100) {
        return fallbackScore;
    }

    return undefined;
}

async function fetchMetacriticHtml(url: string): Promise<{ status: number; body: string }> {
    const { stdout } = await execFileAsync('curl', [
        '--http1.1',
        '--silent',
        '--show-error',
        '--location',
        '--max-time',
        '30',
        '--user-agent',
        'PostmanRuntime/7.43.0',
        '--header',
        'Accept: */*',
        '--header',
        'Connection: keep-alive',
        '--write-out',
        '\n%{http_code}',
        url,
    ]);

    const separatorIndex = stdout.lastIndexOf('\n');
    const statusText = separatorIndex >= 0 ? stdout.slice(separatorIndex + 1).trim() : '';
    const status = Number(statusText);

    if (!Number.isInteger(status)) {
        throw new Error('Failed to parse Metacritic response status');
    }

    const body = separatorIndex >= 0 ? stdout.slice(0, separatorIndex) : '';

    return { status, body };
}

export async function getMetacriticAlbumMetascore(
    albumName: string,
    bandName: string,
    fetchHtml: MetacriticHtmlFetcher = fetchMetacriticHtml,
): Promise<number | undefined> {
    const albumUrl = createMetacriticAlbumUrl(albumName, bandName);
    const response = await fetchHtml(albumUrl);

    if (response.status === 404) {
        return undefined;
    }

    if (response.status >= 400) {
        throw new Error(`Failed to fetch Metacritic page: ${response.status}`);
    }

    return extractMetascoreFromHtml(response.body);
}
