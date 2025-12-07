import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { URLSearchParams } from 'url';

export interface ApiRequest {
    method: string;
    url: string;
    queryParams?: any[];
    headers?: any[];
    body?: any;
    auth?: any;
}

export interface ApiResponse {
    status: number;
    statusText: string;
    data: any;
    headers: any;
    duration: number;
    size: number;
}

export class RequestHandler {
    static async makeRequest(request: ApiRequest, variables: any[] = []): Promise<ApiResponse> {
        const startTime = Date.now();

        // Helper for substitution
        const envMap: Record<string, string> = {};
        if (Array.isArray(variables)) {
            variables.forEach((v) => {
                if (v.isEnabled && v.key) {
                    envMap[v.key] = v.value;
                }
            });
        }

        const substitute = (str: string): string => {
            if (!str) return str;
            return str.replace(/\{\{(.+?)\}\}/g, (_, key) => {
                const k = key.trim();
                return envMap.hasOwnProperty(k) ? envMap[k] : `{{${key}}}`;
            });
        };

        const finalUrl = substitute(request.url);

        // 1. Process Params
        const params: Record<string, string> = {};
        if (Array.isArray(request.queryParams)) {
            request.queryParams.forEach((p) => {
                if (p.isEnabled && p.key) {
                    params[substitute(p.key)] = substitute(p.value);
                }
            });
        }

        // 2. Process Headers
        const headers: Record<string, string> = {};
        if (Array.isArray(request.headers)) {
            request.headers.forEach((h) => {
                if (h.isEnabled && h.key) {
                    headers[substitute(h.key)] = substitute(h.value);
                }
            });
        }

        // 3. Process Body
        let data: any = null;
        if (request.body) {
            const bodyType = request.body.type;
            if (bodyType === 'raw') {
                data = substitute(request.body.raw || '');
            } else if (bodyType === 'x-www-form-urlencoded') {
                const urlParams = new URLSearchParams();
                if (Array.isArray(request.body.urlencoded)) {
                    request.body.urlencoded.forEach((p: any) => {
                        if (p.isEnabled && p.key) {
                            urlParams.append(substitute(p.key), substitute(p.value));
                        }
                    });
                }
                data = urlParams.toString();
                if (!headers['Content-Type'] && !headers['content-type']) {
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
            } else if (bodyType === 'form-data') {
                // Basic support: convert to object (JSON) as fallback since we don't have form-data package
                const formData: Record<string, any> = {};
                if (Array.isArray(request.body.formData)) {
                    request.body.formData.forEach((p: any) => {
                        if (p.isEnabled && p.key) {
                            formData[substitute(p.key)] = substitute(p.value);
                        }
                    });
                }
                data = formData;
            } else if (bodyType === 'graphql') {
                data = {
                    query: substitute(request.body.graphql?.query || ''),
                    variables: request.body.graphql?.variables
                        ? JSON.parse(substitute(request.body.graphql.variables || '{}'))
                        : {}
                };
            }
        }

        const config: AxiosRequestConfig = {
            method: request.method,
            url: finalUrl,
            params: params,
            headers: headers,
            data: data,
            validateStatus: () => true, // Don't throw on error status
            transformResponse: [
                (data) => {
                    try {
                        // Try to parse JSON response
                        if (typeof data === 'string') {
                            return JSON.parse(data);
                        }
                        return data;
                    } catch {
                        return data;
                    }
                }
            ]
        };

        try {
            const response: AxiosResponse = await axios(config);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Calculate approximate size
            const size = JSON.stringify(response.data).length + JSON.stringify(response.headers).length;

            return {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
                headers: response.headers,
                duration,
                size
            };
        } catch (error: any) {
            const endTime = Date.now();
            return {
                status: 0,
                statusText: 'Error',
                data: error.message || 'Unknown Error',
                headers: {},
                duration: endTime - startTime,
                size: 0
            };
        }
    }
}
