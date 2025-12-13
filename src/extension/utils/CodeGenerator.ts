import * as curlconverter from 'curlconverter';
import { ApiRequest } from '../../webview/src/types';

export class CodeGenerator {
    static generate(request: ApiRequest, language: string): string {
        const curl = this.toCurl(request);

        try {
            switch (language) {
                case 'curl':
                    return curl;
                case 'javascript': // Fetch
                    // @ts-ignore
                    return curlconverter.toJavaScript(curl);
                case 'javascript-xhr':
                    // @ts-ignore
                    return curlconverter.toJavaScriptXHR(curl);
                case 'axios':
                    // @ts-ignore
                    return curlconverter.toNodeAxios(curl);
                case 'node': // NodeJs-request
                    // @ts-ignore
                    return curlconverter.toNodeRequest(curl);
                default:
                    return 'Unsupported language';
            }
        } catch (e) {
            return `Error generating code: ${e}`;
        }
    }

    private static toCurl(request: ApiRequest): string {
        let cmd = `curl -X ${request.method} '${request.url}'`;

        // Headers
        if (request.headers) {
            request.headers.forEach((h) => {
                if (h.isEnabled && h.key) {
                    cmd += ` \\\n -H '${h.key}: ${h.value}'`;
                }
            });
        }

        // Body
        if (request.body && request.body.type !== 'none') {
            if (request.body.type === 'raw') {
                cmd += ` \\\n -d '${(request.body.raw || '').replace(/'/g, "'\\''")}'`;
            } else if (request.body.type === 'x-www-form-urlencoded') {
                request.body.urlencoded?.forEach((u) => {
                    if (u.isEnabled && u.key) {
                        cmd += ` \\\n --data-urlencode '${u.key}=${u.value}'`;
                    }
                });
            } else if (request.body.type === 'form-data') {
                request.body.formData?.forEach((f) => {
                    if (f.isEnabled && f.key) {
                        cmd += ` \\\n -F '${f.key}=${f.value}'`;
                    }
                });
            }
        }

        return cmd;
    }
}
