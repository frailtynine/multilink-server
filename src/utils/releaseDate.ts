export function releaseDatesMatch(sourceReleaseDate: string, targetReleaseDate: string): boolean {
    const normalizedSourceReleaseDate = sourceReleaseDate.trim();
    const normalizedTargetReleaseDate = targetReleaseDate.slice(0, 10);

    if (!normalizedSourceReleaseDate) {
        return true;
    }

    return normalizedTargetReleaseDate.startsWith(normalizedSourceReleaseDate);
}
