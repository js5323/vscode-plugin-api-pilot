import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiRequest {
    method: string;
    url: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
    body?: any;
    auth?: any; // To be defined strictly later
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
    static async makeRequest(request: ApiRequest): Promise<ApiResponse> {
        const startTime = Date.now();
        
        const config: AxiosRequestConfig = {
            method: request.method,
            url: request.url,
            params: request.params,
            headers: request.headers,
            data: request.body,
            validateStatus: () => true, // Don't throw on error status
            transformResponse: [data => data] // Keep raw data for now, or let axios parse JSON
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
