"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseDatesMatch = releaseDatesMatch;
function releaseDatesMatch(sourceReleaseDate, targetReleaseDate) {
    const normalizedSourceReleaseDate = sourceReleaseDate.trim();
    const normalizedTargetReleaseDate = targetReleaseDate.slice(0, 10);
    if (!normalizedSourceReleaseDate) {
        return true;
    }
    return normalizedTargetReleaseDate.startsWith(normalizedSourceReleaseDate);
}
