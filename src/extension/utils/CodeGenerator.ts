import * as curlconverter from 'curlconverter';
import { ApiRequest, CurlSettings, DEFAULT_CURL_SETTINGS } from '../../shared/types';

const CANONICAL_CURL_SETTINGS: CurlSettings = {
    multiline: false,
    longForm: false,
    lineContinuation: '\\',
    quoteType: 'single',
    timeout: 0,
    followRedirects: true,
    silent: false
};

export class CodeGenerator {
    static generate(request: ApiRequest, language: string, settings: CurlSettings = DEFAULT_CURL_SETTINGS): string {
        if (language === 'curl') {
            return this.toCurl(request, settings);
        }

        // For other languages, generate a canonical curl string that curlconverter can parse reliably
        const curl = this.toCurl(request, CANONICAL_CURL_SETTINGS);

        try {
            switch (language) {
                case 'javascript': // Fetch
                    return curlconverter.toJavaScript(curl);
                case 'javascript-xhr':
                    return curlconverter.toJavaScriptXHR(curl);
                case 'axios':
                    return curlconverter.toNodeAxios(curl);
                case 'node': // NodeJs-request
                    return curlconverter.toNodeRequest(curl);
                default:
                    return 'Unsupported language';
            }
        } catch (e) {
            return `Error generating code: ${e}`;
        }
    }

    private static toCurl(request: ApiRequest, settings: CurlSettings): string {
        const { multiline, longForm, lineContinuation, quoteType, timeout, followRedirects, silent } = settings;

        const lineEnd = multiline ? ` ${lineContinuation}\n` : ' ';
        const quote = (str: string) => {
            if (quoteType === 'double') {
                // Escape double quotes and backslashes
                return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
            }
            // Escape single quotes
            return `'${str.replace(/'/g, "'\\''")}'`;
        };

        const option = (shortOpt: string, longOpt: string) => (longForm ? longOpt : shortOpt);

        let cmd = `curl`;

        if (silent) cmd += ` ${option('-s', '--silent')}`;
        if (followRedirects) cmd += ` ${option('-L', '--location')}`;
        if (timeout > 0) cmd += ` ${option('-m', '--max-time')} ${timeout}`;

        cmd += ` ${option('-X', '--request')} ${request.method}`;
        cmd += ` ${quote(request.url)}`;

        // Headers
        if (request.headers) {
            request.headers.forEach((h) => {
                if (h.isEnabled && h.key) {
                    cmd += `${lineEnd}${option('-H', '--header')} ${quote(`${h.key}: ${h.value}`)}`;
                }
            });
        }

        // Body
        if (request.body && request.body.type !== 'none') {
            if (request.body.type === 'raw') {
                cmd += `${lineEnd}${option('-d', '--data')} ${quote(request.body.raw || '')}`;
            } else if (request.body.type === 'x-www-form-urlencoded') {
                request.body.urlencoded?.forEach((u) => {
                    if (u.isEnabled && u.key) {
                        // curl --data-urlencode doesn't use -d flag, it uses --data-urlencode directly.
                        // Short form for --data-urlencode? There isn't a standard short form in curl man page usually,
                        // but sometimes -d is used with url encoding manually.
                        // curlconverter usually expects --data-urlencode.
                        // Let's assume --data-urlencode is always used or check if there is a short one.
                        // For consistency with original code:
                        // original: cmd += ` \\\n --data-urlencode '${u.key}=${u.value}'`;
                        cmd += `${lineEnd}--data-urlencode ${quote(`${u.key}=${u.value}`)}`;
                    }
                });
            } else if (request.body.type === 'form-data') {
                request.body.formData?.forEach((f) => {
                    if (f.isEnabled && f.key) {
                        cmd += `${lineEnd}${option('-F', '--form')} ${quote(`${f.key}=${f.value}`)}`;
                    }
                });
            } else if (request.body.type === 'graphql') {
                const query = request.body.graphql?.query || '';
                const variables = request.body.graphql?.variables;
                // GraphQL is typically sent as JSON in body
                const payload: { query: string; variables?: object } = { query };
                if (variables) {
                    try {
                        payload.variables = JSON.parse(variables);
                    } catch {
                        // ignore invalid json variables
                    }
                }
                cmd += `${lineEnd}${option('-d', '--data')} ${quote(JSON.stringify(payload))}`;
                // Should also ensure Content-Type is application/json if not present?
                // Original code didn't handle graphql specifically in toCurl, it fell through?
                // Wait, original code:
                // if (request.body.type === 'raw') ...
                // else if (request.body.type === 'x-www-form-urlencoded') ...
                // else if (request.body.type === 'form-data') ...
                // It missed graphql! I should add it.
            }
        }

        return cmd;
    }
}
