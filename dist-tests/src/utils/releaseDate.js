"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseDatesMatch = releaseDatesMatch;
function releaseDatesMatch(sourceReleaseDate, targetReleaseDate) {
    const normalizedSourceReleaseDate = sourceReleaseDate.trim();
    const normalizedTargetReleaseDate = targetReleaseDate.slice(0, 10);
    const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    if (!normalizedSourceReleaseDate) {
        return true;
    }
    const fullDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (fullDatePattern.test(normalizedSourceReleaseDate) && fullDatePattern.test(normalizedTargetReleaseDate)) {
        const sourceTimestamp = Date.parse(`${normalizedSourceReleaseDate}T00:00:00Z`);
        const targetTimestamp = Date.parse(`${normalizedTargetReleaseDate}T00:00:00Z`);
        if (!Number.isNaN(sourceTimestamp) && !Number.isNaN(targetTimestamp)) {
            return Math.abs(sourceTimestamp - targetTimestamp) <= sevenDaysInMilliseconds;
        }
    }
    return normalizedTargetReleaseDate.startsWith(normalizedSourceReleaseDate);
}
