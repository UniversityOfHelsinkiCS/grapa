export const formatSearchQuery = (
  search: string | undefined
): string | undefined => {
  if (!search) return undefined
  return search
    .replace(/['|&!():]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => `${word}:*`)
    .join(' & ')
}
