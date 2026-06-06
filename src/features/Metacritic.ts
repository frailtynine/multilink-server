import puppeteer from 'puppeteer-core';

const METACRITIC_MUSIC_BASE_URL = 'https://www.metacritic.com/music';

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
    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

        const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30_000,
        });

        const status = response?.status() ?? 0;
        const body = await page.content();

        if (!Number.isInteger(status) || status <= 0) {
            throw new Error('Failed to parse Metacritic response status');
        }

        return { status, body };
    } finally {
        await browser.close();
    }
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
