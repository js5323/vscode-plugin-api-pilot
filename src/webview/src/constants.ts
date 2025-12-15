export const METHOD_COLORS: Record<string, string> = {
    GET: 'success',
    POST: 'warning',
    PUT: 'info',
    DELETE: 'error',
    PATCH: 'default'
};

export const DEFAULT_REQUEST_HEADERS = [
    { key: 'Content-Type', value: 'application/json', isEnabled: true },
    { key: 'User-Agent', value: 'ApiPilotRuntime/1.0.0', isEnabled: true },
    { key: 'Accept', value: '*/*', isEnabled: true },
    { key: 'Cache-Control', value: 'no-cache', isEnabled: true },
    { key: 'Accept-Encoding', value: 'gzip, deflate, br', isEnabled: true },
    { key: 'Connection', value: 'keep-alive', isEnabled: true }
];
