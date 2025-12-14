import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { URLSearchParams } from 'url';
import * as https from 'https';
import * as fs from 'fs';
import { Logger } from './utils/Logger';
import { ApiRequest, KeyValueItem, Settings } from '../shared/types';

export interface ApiResponse {
    status: number;
    statusText: string;
    data: unknown;
    headers: unknown;
    duration: number;
    size: number;
}

export class RequestHandler {
    static async makeRequest(
        request: ApiRequest,
        variables: KeyValueItem[] = [],
        settings?: Settings
    ): Promise<ApiResponse> {
        Logger.log('Starting Request Execution...');
        Logger.log(`Request Method: ${request.method}`);
        Logger.log(`Raw URL: ${request.url}`);

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
        Logger.log(`Environment Variables Loaded: ${Object.keys(envMap).length}`);

        const substitute = (str: string): string => {
            if (!str) return str;
            return str.replace(/\{\{(.+?)\}\}/g, (_, key) => {
                const k = key.trim();
                const val = envMap.hasOwnProperty(k) ? envMap[k] : `{{${key}}}`;
                return val;
            });
        };

        const finalUrl = substitute(request.url);
        Logger.log(`Final URL: ${finalUrl}`);

        // 1. Process Params
        const params: Record<string, string> = {};
        if (Array.isArray(request.queryParams)) {
            request.queryParams.forEach((p) => {
                if (p.isEnabled && p.key) {
                    const key = substitute(p.key);
                    const val = substitute(p.value);
                    params[key] = val;
                }
            });
        }
        if (Object.keys(params).length > 0) {
            Logger.log('Query Params:', params);
        }

        // 2. Process Headers
        const headers: Record<string, string> = {};
        if (Array.isArray(request.headers)) {
            request.headers.forEach((h) => {
                if (h.isEnabled && h.key) {
                    const key = substitute(h.key);
                    const val = substitute(h.value);
                    headers[key] = val;
                }
            });
        }
        Logger.log('Headers:', headers);

        // 3. Process Body
        let data: unknown = null;
        if (request.body) {
            const bodyType = request.body.type;
            Logger.log(`Processing Body Type: ${bodyType}`);

            if (bodyType === 'raw') {
                data = substitute(request.body.raw || '');
            } else if (bodyType === 'x-www-form-urlencoded') {
                const urlParams = new URLSearchParams();
                if (Array.isArray(request.body.urlencoded)) {
                    request.body.urlencoded.forEach((p: KeyValueItem) => {
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
                const formData: Record<string, unknown> = {};
                if (Array.isArray(request.body.formData)) {
                    request.body.formData.forEach((p: KeyValueItem) => {
                        if (p.isEnabled && p.key) {
                            formData[substitute(p.key)] = substitute(p.value);
                        }
                    });
                }
                data = formData;
                // Axios will treat object as JSON by default, but we wanted form-data...
                // Without 'form-data' package in Node, this is tricky.
                // We will send as JSON for now or user should install form-data.
                // Or we construct a boundary manually (too complex for now).
                if (!headers['Content-Type'] && !headers['content-type']) {
                    headers['Content-Type'] = 'application/json';
                }
            }
        }

        // Configure HTTPS Agent
        const httpsAgent = new https.Agent({
            rejectUnauthorized: settings?.general?.sslVerification ?? true
        });

        if (settings) {
            // CA Certificates
            if (settings.certificates?.ca?.length > 0) {
                const caCerts = settings.certificates.ca
                    .map((path) => {
                        try {
                            if (fs.existsSync(path)) {
                                return fs.readFileSync(path);
                            }
                            Logger.error(`CA cert not found: ${path}`);
                            return null;
                        } catch (e) {
                            Logger.error(`Failed to read CA cert: ${path}`, e);
                            return null;
                        }
                    })
                    .filter((cert): cert is Buffer => cert !== null);

                if (caCerts.length > 0) {
                    httpsAgent.options.ca = caCerts;
                }
            }

            // Client Certificates
            if (settings.certificates?.client?.length > 0) {
                try {
                    const urlObj = new URL(finalUrl);
                    const hostname = urlObj.hostname;
                    const clientCert = settings.certificates.client.find((c) => c.host === hostname);

                    if (clientCert) {
                        Logger.log(`Using client certificate for host: ${hostname}`);
                        if (clientCert.pfx && fs.existsSync(clientCert.pfx)) {
                            httpsAgent.options.pfx = fs.readFileSync(clientCert.pfx);
                            if (clientCert.passphrase) {
                                httpsAgent.options.passphrase = clientCert.passphrase;
                            }
                        } else {
                            if (clientCert.crt && fs.existsSync(clientCert.crt)) {
                                httpsAgent.options.cert = fs.readFileSync(clientCert.crt);
                            }
                            if (clientCert.key && fs.existsSync(clientCert.key)) {
                                httpsAgent.options.key = fs.readFileSync(clientCert.key);
                            }
                            if (clientCert.passphrase) {
                                httpsAgent.options.passphrase = clientCert.passphrase;
                            }
                        }
                    }
                } catch (e) {
                    Logger.error('Failed to configure client certificate', e);
                }
            }
        }

        const config: AxiosRequestConfig = {
            method: request.method as string,
            url: finalUrl,
            headers: headers,
            params: params,
            data: data,
            validateStatus: () => true, // Don't throw on error status
            httpsAgent: httpsAgent
        };

        try {
            const response: AxiosResponse = await axios(config);
            const duration = Date.now() - startTime;

            // Calculate size (approx)
            const size = JSON.stringify(response.data).length + JSON.stringify(response.headers).length;

            return {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
                headers: response.headers,
                duration,
                size
            };
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            const err = error as { message: string; response?: AxiosResponse };
            Logger.error(`Request Failed: ${err.message}`, error);

            return {
                status: err.response?.status || 0,
                statusText: err.response?.statusText || 'Error',
                data: err.response?.data || { message: err.message },
                headers: err.response?.headers || {},
                duration,
                size: 0
            };
        }
    }
}
