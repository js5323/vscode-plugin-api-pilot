import * as yaml from 'js-yaml';
import { CollectionItem, ApiRequest, CollectionFolder } from '../../shared/types';

interface OpenApiSpec {
    openapi: string;
    info: {
        title: string;
        version: string;
    };
    paths: Record<string, Record<string, unknown>>;
    tags?: { name: string }[];
}

interface OpenApiMediaType {
    schema: {
        type: string;
        properties?: Record<string, unknown>;
        example?: unknown;
    };
}

interface OpenApiOperation {
    summary: string;
    responses: Record<string, unknown>;
    tags?: string[];
    parameters?: Record<string, unknown>[];
    requestBody?: {
        content: Record<string, OpenApiMediaType>;
    };
}

export class Exporter {
    static exportToSwagger(collection: CollectionFolder | CollectionItem[]): string {
        const openApi: OpenApiSpec = {
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

    private static processItems(items: CollectionItem[], openApi: OpenApiSpec, tag?: string) {
        items.forEach((item) => {
            if (item.type === 'folder') {
                this.processItems((item as CollectionFolder).children, openApi, item.name);
            } else if (item.type === 'request') {
                this.addRequestToOpenApi(item as ApiRequest, openApi, tag);
            }
        });
    }

    private static addRequestToOpenApi(request: ApiRequest, openApi: OpenApiSpec, tag?: string) {
        try {
            const urlObj = new URL(request.url.startsWith('http') ? request.url : `http://${request.url}`);
            const path = urlObj.pathname;
            const method = request.method.toLowerCase();

            if (!openApi.paths[path]) {
                openApi.paths[path] = {};
            }

            const operation: OpenApiOperation = {
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
            const parameters: Record<string, unknown>[] = [];

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
                const requestBody: { content: Record<string, OpenApiMediaType> } = {
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
                            const mediaType = requestBody.content['application/x-www-form-urlencoded'];
                            if (mediaType.schema.properties) {
                                mediaType.schema.properties[u.key] = {
                                    type: 'string',
                                    example: u.value
                                };
                            }
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
                            const mediaType = requestBody.content['multipart/form-data'];
                            if (mediaType.schema.properties) {
                                mediaType.schema.properties[f.key] = {
                                    type: 'string',
                                    example: f.value
                                };
                            }
                        }
                    });
                }

                operation.requestBody = requestBody;
            }

            // We need to cast operation to unknown first because Record<string, unknown> values are not strictly checked against specific interfaces in assignment if not fully compatible index signature wise
            // But actually openApi.paths[path][method] expects Record<string, unknown>
            // And OpenApiOperation can be assigned to Record<string, unknown> if we are careful or use unknown
            // Let's use 'as any' just for the assignment to the map, or better, type paths values as OpenApiOperation | any
            // But for now, let's keep Record<string, unknown> and cast operation
            openApi.paths[path][method] = operation as unknown as Record<string, unknown>;
        } catch (e) {
            // Invalid URL or other error, skip or log
            console.error('Error exporting request', request.name, e);
        }
    }
}
