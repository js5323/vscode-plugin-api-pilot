import * as yaml from 'js-yaml';
import { CollectionItem, ApiRequest, CollectionFolder } from '../../webview/src/types';

export class Exporter {
    static exportToSwagger(collection: CollectionFolder | CollectionItem[]): string {
        const openApi: any = {
            openapi: '3.0.0',
            info: {
                title: 'Exported Collection',
                version: '1.0.0'
            },
            paths: {}
        };

        const items = Array.isArray(collection) ? collection : [collection];
        this.processItems(items, openApi);

        return yaml.dump(openApi);
    }

    private static processItems(items: CollectionItem[], openApi: any, tag?: string) {
        items.forEach((item) => {
            if (item.type === 'folder') {
                this.processItems((item as CollectionFolder).children, openApi, item.name);
            } else if (item.type === 'request') {
                this.addRequestToOpenApi(item as ApiRequest, openApi, tag);
            }
        });
    }

    private static addRequestToOpenApi(request: ApiRequest, openApi: any, tag?: string) {
        try {
            const urlObj = new URL(request.url.startsWith('http') ? request.url : `http://${request.url}`);
            const path = urlObj.pathname;
            const method = request.method.toLowerCase();

            if (!openApi.paths[path]) {
                openApi.paths[path] = {};
            }

            const operation: any = {
                summary: request.name,
                responses: {
                    '200': {
                        description: 'OK'
                    }
                }
            };

            if (tag) {
                operation.tags = [tag];
            }

            // Params
            const parameters: any[] = [];

            // Query params
            if (request.queryParams) {
                request.queryParams.forEach((p) => {
                    if (p.isEnabled && p.key) {
                        parameters.push({
                            name: p.key,
                            in: 'query',
                            schema: { type: 'string' },
                            example: p.value
                        });
                    }
                });
            }

            // Headers
            if (request.headers) {
                request.headers.forEach((h) => {
                    if (h.isEnabled && h.key && h.key.toLowerCase() !== 'content-type') {
                        parameters.push({
                            name: h.key,
                            in: 'header',
                            schema: { type: 'string' },
                            example: h.value
                        });
                    }
                });
            }

            if (parameters.length > 0) {
                operation.parameters = parameters;
            }

            // Body
            if (request.body && request.body.type !== 'none') {
                const requestBody: any = {
                    content: {}
                };

                if (request.body.type === 'raw') {
                    // Try to guess content type or default to application/json
                    const contentType =
                        request.headers?.find((h) => h.key.toLowerCase() === 'content-type')?.value ||
                        'application/json';
                    requestBody.content[contentType] = {
                        schema: {
                            type: 'object', // Simplification
                            example: request.body.raw
                        }
                    };
                } else if (request.body.type === 'x-www-form-urlencoded') {
                    requestBody.content['application/x-www-form-urlencoded'] = {
                        schema: {
                            type: 'object',
                            properties: {}
                        }
                    };
                    request.body.urlencoded?.forEach((u) => {
                        if (u.isEnabled && u.key) {
                            requestBody.content['application/x-www-form-urlencoded'].schema.properties[u.key] = {
                                type: 'string',
                                example: u.value
                            };
                        }
                    });
                } else if (request.body.type === 'form-data') {
                    requestBody.content['multipart/form-data'] = {
                        schema: {
                            type: 'object',
                            properties: {}
                        }
                    };
                    request.body.formData?.forEach((f) => {
                        if (f.isEnabled && f.key) {
                            requestBody.content['multipart/form-data'].schema.properties[f.key] = {
                                type: 'string',
                                example: f.value
                            };
                        }
                    });
                }

                operation.requestBody = requestBody;
            }

            openApi.paths[path][method] = operation;
        } catch (e) {
            // Invalid URL or other error, skip or log
            console.error('Error exporting request', request.name, e);
        }
    }
}
