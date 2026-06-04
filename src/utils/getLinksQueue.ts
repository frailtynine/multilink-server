import Bottleneck from 'bottleneck';

const MAX_QUEUE_WAIT_MS = 30_000;

const getLinksLimiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1_000,
});

export class GetLinksQueueTimeoutError extends Error {
    public constructor() {
        super('Request timed out while waiting in queue');
        this.name = 'GetLinksQueueTimeoutError';
    }
}

export function scheduleGetLinksRequest<T>(job: () => Promise<T>): Promise<T> {
    const enqueuedAt = Date.now();

    return getLinksLimiter.schedule(async () => {
        if (Date.now() - enqueuedAt > MAX_QUEUE_WAIT_MS) {
            throw new GetLinksQueueTimeoutError();
        }

        return job();
    });
}
