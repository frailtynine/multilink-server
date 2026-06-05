"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLinksQueueTimeoutError = void 0;
exports.scheduleGetLinksRequest = scheduleGetLinksRequest;
const bottleneck_1 = __importDefault(require("bottleneck"));
const MAX_QUEUE_WAIT_MS = 30_000;
const getLinksLimiter = new bottleneck_1.default({
    maxConcurrent: 1,
    minTime: 1_000,
});
class GetLinksQueueTimeoutError extends Error {
    constructor() {
        super('Request timed out while waiting in queue');
        this.name = 'GetLinksQueueTimeoutError';
    }
}
exports.GetLinksQueueTimeoutError = GetLinksQueueTimeoutError;
function scheduleGetLinksRequest(job) {
    const enqueuedAt = Date.now();
    return getLinksLimiter.schedule(async () => {
        if (Date.now() - enqueuedAt > MAX_QUEUE_WAIT_MS) {
            throw new GetLinksQueueTimeoutError();
        }
        return job();
    });
}
