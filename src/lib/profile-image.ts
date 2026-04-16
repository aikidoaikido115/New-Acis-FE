export const DEFAULT_PROFILE_IMAGE = "/images/profile.png";

const DEFAULT_PROFILE_IMAGE_URLS = new Set([
  DEFAULT_PROFILE_IMAGE,
  "https://www.isranews.org/article/images/2025/Harry/6/Hun_Sen_July_2019.jpg",
]);

export function resolveProfileImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  return DEFAULT_PROFILE_IMAGE_URLS.has(url) ? undefined : url;
}
