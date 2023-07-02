export const ParseQuery = (query: string): { [queryName: string]: string } => {
  if (!query) return {};

  const returningList: { [queryName: string]: string } = {};

  try {
    const searchParams = new URLSearchParams(query);
    searchParams.forEach((value, key) => {
      returningList[key] = value || 'true';
    });
  } catch (e) {
    query
      .toString()
      .replace(/^\?/, '')
      .split('&')
      .forEach((queryPair) => {
        try {
          if (queryPair.split('=')[1])
            returningList[queryPair.split('=')[0]] = decodeURIComponent(queryPair.split('=')[1]);
          else returningList[queryPair.split('=')[0]] = 'true';
        } catch (_) {
          returningList[queryPair.split('=')[0]] = queryPair.split('=')[1] || 'true';
        }
      });
  }

  return returningList;
};

export const ParsePath = (path: string | string[]): string[] => {
  if (Array.isArray(path))
    return path
      .map((part) => part.toString().split('/'))
      .flat()
      .filter(Boolean);

  if (typeof path === 'string') return path.split('/').filter(Boolean);

  return path;
};

export const SafeParseURL = (link: string | undefined, base?: string | URL): URL => {
  if (!link) link = '';

  try {
    return new URL(link, base);
    // eslint-disable-next-line no-empty
  } catch (e) {}

  try {
    return new URL(`https://${link}`);
    // eslint-disable-next-line no-empty
  } catch (e) {}

  try {
    return new URL(link, 'https://example.com');
    // eslint-disable-next-line no-empty
  } catch (e) {}

  return new URL('https://example.com');
};
