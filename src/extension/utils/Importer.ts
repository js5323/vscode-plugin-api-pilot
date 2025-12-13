import * as curlconverter from 'curlconverter';
import * as yaml from 'js-yaml';
import {
    CollectionItem,
    ApiRequest,
    KeyValueItem,
    ApiRequestBody,
    ApiExample,
    RequestMethod
} from '../../shared/types';

interface PostmanHeader {
    key: string;
    value: string;
}

interface PostmanQuery {
    key: string;
    value: string;
}

interface PostmanUrl {
    raw?: string;
    query?: PostmanQuery[];
}

interface PostmanBody {
    mode: 'raw' | 'formdata' | 'urlencoded';
    raw?: string;
    formdata?: { key: string; value: string }[];
    urlencoded?: { key: string; value: string }[];
}

interface PostmanRequest {
    method: string;
    url: string | PostmanUrl;
    header?: PostmanHeader[];
    body?: PostmanBody;
}

interface PostmanItem {
    name: string;
    item?: PostmanItem[]; // Folder
    request?: PostmanRequest; // Request
}

interface OpenApiParameter {
    name: string;
    in: string;
    description?: string;
    required?: boolean;
    schema?: { type: string };
    example?: unknown;
}

interface OpenApiMediaType {
    schema?: {
        type?: string;
        example?: unknown;
        properties?: Record<string, { example?: unknown; default?: unknown; description?: string; format?: string }>;
    };
}

interface OpenApiRequestBody {
    description?: string;
    content?: Record<string, OpenApiMediaType>;
}

interface OpenApiResponse {
    description?: string;
    content?: Record<string, OpenApiMediaType>;
}

interface OpenApiOperation {
    summary?: string;
    description?: string;
    operationId?: string;
    parameters?: OpenApiParameter[];
    requestBody?: OpenApiRequestBody;
    responses?: Record<string, OpenApiResponse>;
    tags?: string[];
}

interface CurlRequest {
    method?: string;
    url: string;
    headers?: Record<string, string>;
    queries?: Record<string, string>;
    data?: string | object;
    body?: string | object;
    multipartUploads?: unknown;
}

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export class Importer {
    static parse(content: string): CollectionItem[] {
        content = content.trim();

        // Try JSON (Postman / OpenAPI)
        try {
            const json = JSON.parse(content);
            if (json.info && json.item) {
                return this.parsePostman(json.item);
            }
            if (json.openapi || json.swagger) {
                return this.parseOpenApi(json);
            }
        } catch {
            // Check if it might be YAML
            // Try to match "openapi: 3.x.x" or "swagger: '2.0'"
            try {
                const parsedYaml = yaml.load(content);
                if (typeof parsedYaml === 'object' && parsedYaml !== null) {
                    const apiDef = parsedYaml as { openapi?: string; swagger?: string };
                    if (apiDef.openapi || apiDef.swagger) {
                        return this.parseOpenApi(
                            apiDef as {
                                paths?: Record<string, Record<string, OpenApiOperation>>;
                                servers?: { url: string }[];
                            }
                        );
                    }
                }
            } catch {
                // Not YAML
            }
            // Not JSON or YAML, continue to cURL
        }

        // Try cURL
        if (content.toLowerCase().startsWith('curl')) {
            return this.parseCurl(content);
        }

        throw new Error(
            'Unknown or unsupported format. Please ensure content is valid JSON (Postman/OpenAPI) or a cURL command.'
        );
    }

    private static parsePostman(items: PostmanItem[]): CollectionItem[] {
        return items.map((item: PostmanItem) => {
            if (item.item) {
                // Folder
                return {
                    id: uuidv4(),
                    name: item.name,
                    type: 'folder',
                    children: this.parsePostman(item.item)
                };
            } else {
                // Request
                const req = item.request!;
                const url = typeof req.url === 'string' ? req.url : req.url?.raw || '';
                return {
                    id: uuidv4(),
                    name: item.name,
                    type: 'request',
                    method: req.method as RequestMethod,
                    url: url,
                    headers: req.header
                        ? req.header.map((h) => ({
                              id: uuidv4(),
                              key: h.key,
                              value: h.value,
                              isEnabled: true
                          }))
                        : [],
                    queryParams:
                        typeof req.url !== 'string' && req.url?.query
                            ? req.url.query.map((q) => ({
                                  id: uuidv4(),
                                  key: q.key,
                                  value: q.value,
                                  isEnabled: true
                              }))
                            : [],
                    body: this.parsePostmanBody(req.body)
                } as ApiRequest;
            }
        });
    }

    private static parsePostmanBody(body: PostmanBody | undefined): ApiRequestBody {
        if (!body) return { type: 'none' };
        if (body.mode === 'raw') {
            return { type: 'raw', raw: body.raw };
        }
        if (body.mode === 'formdata' && body.formdata) {
            return {
                type: 'form-data',
                formData: body.formdata.map((f) => ({
                    id: uuidv4(),
                    key: f.key,
                    value: f.value,
                    isEnabled: true
                }))
            };
        }
        if (body.mode === 'urlencoded' && body.urlencoded) {
            return {
                type: 'x-www-form-urlencoded',
                urlencoded: body.urlencoded.map((u) => ({
                    id: uuidv4(),
                    key: u.key,
                    value: u.value,
                    isEnabled: true
                }))
            };
        }
        return { type: 'none' };
    }

    private static parseOpenApi(json: {
        paths?: Record<string, Record<string, OpenApiOperation>>;
        servers?: { url: string }[];
    }): CollectionItem[] {
        const paths = json.paths || {};
        const items: CollectionItem[] = [];

        // Simple grouping by first tag or flattened
        // For better structure, we could group by tags.
        const tagsMap = new Map<string, ApiRequest[]>();

        Object.entries(paths).forEach(([path, methods]) => {
            Object.entries(methods).forEach(([method, operation]) => {
                if (method === 'parameters' || method === 'servers') return; // Skip non-methods

                const req: ApiRequest = {
                    id: uuidv4(),
                    name: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
                    type: 'request',
                    method: method.toUpperCase() as RequestMethod,
                    url: json.servers?.[0]?.url ? `${json.servers[0].url}${path}` : path,
                    headers: [] as KeyValueItem[],
                    queryParams: [] as KeyValueItem[],
                    body: { type: 'none' } as ApiRequestBody,
                    description: this.generateDescription(operation),
                    examples: this.extractExamples(operation)
                };

                // Extract params
                if (operation.parameters) {
                    operation.parameters.forEach((p) => {
                        if (p.in === 'query') {
                            req.queryParams?.push({
                                id: uuidv4(),
                                key: p.name,
                                value: typeof p.example === 'string' ? p.example : '',
                                description: p.description,
                                isEnabled: true
                            });
                        } else if (p.in === 'header') {
                            req.headers?.push({
                                id: uuidv4(),
                                key: p.name,
                                value: typeof p.example === 'string' ? p.example : '',
                                description: p.description,
                                isEnabled: true
                            });
                        }
                    });
                }

                // Extract Body
                if (operation.requestBody && operation.requestBody.content) {
                    const content = operation.requestBody.content;
                    if (content['application/json']) {
                        req.body = {
                            type: 'raw',
                            rawType: 'JSON',
                            raw: '{}' // Default empty JSON
                        };
                        // Try to generate example from schema if possible (simple)
                        try {
                            const schema = content['application/json'].schema;
                            if (schema && schema.example) {
                                req.body.raw = JSON.stringify(schema.example, null, 2);
                            }
                        } catch {}
                    } else if (content['application/x-www-form-urlencoded']) {
                        const schema = content['application/x-www-form-urlencoded'].schema;
                        const urlencoded: KeyValueItem[] = [];
                        if (schema && schema.properties) {
                            Object.entries(schema.properties).forEach(([key, prop]) => {
                                urlencoded.push({
                                    id: uuidv4(),
                                    key: key,
                                    value: String(prop.example || prop.default || ''),
                                    description: prop.description,
                                    isEnabled: true
                                });
                            });
                        }
                        req.body = {
                            type: 'x-www-form-urlencoded',
                            urlencoded
                        };
                    } else if (content['multipart/form-data']) {
                        const schema = content['multipart/form-data'].schema;
                        const formData: KeyValueItem[] = [];
                        if (schema && schema.properties) {
                            Object.entries(schema.properties).forEach(([key, prop]) => {
                                formData.push({
                                    id: uuidv4(),
                                    key: key,
                                    value: String(prop.example || prop.default || ''),
                                    description: prop.description,
                                    type: prop.format === 'binary' ? 'file' : 'text',
                                    isEnabled: true
                                });
                            });
                        }
                        req.body = {
                            type: 'form-data',
                            formData
                        };
                    }
                }

                // Grouping
                const tag = operation.tags?.[0] || 'Default';
                if (!tagsMap.has(tag)) {
                    tagsMap.set(tag, []);
                }
                tagsMap.get(tag)!.push(req);
            });
        });

        // Convert map to folders
        tagsMap.forEach((requests, tag) => {
            if (tag === 'Default') {
                items.push(...requests);
            } else {
                items.push({
                    id: uuidv4(),
                    name: tag,
                    type: 'folder',
                    children: requests
                });
            }
        });

        return items;
    }

    private static generateDescription(operation: OpenApiOperation): string {
        let desc = '';
        if (operation.summary) desc += `### ${operation.summary}\n\n`;
        if (operation.description) desc += `${operation.description}\n\n`;

        // Parameters
        if (operation.parameters && operation.parameters.length > 0) {
            desc += `#### Parameters\n\n`;
            desc += `| Name | In | Type | Required | Description |\n`;
            desc += `|------|----|------|----------|-------------|\n`;
            operation.parameters.forEach((p) => {
                const type = p.schema ? p.schema.type : '';
                desc += `| ${p.name} | ${p.in} | ${type} | ${p.required ? 'Yes' : 'No'} | ${p.description || ''} |\n`;
            });
            desc += `\n`;
        }

        // Request Body
        if (operation.requestBody) {
            desc += `#### Request Body\n\n`;
            if (operation.requestBody.description) desc += `${operation.requestBody.description}\n\n`;
            const content = operation.requestBody.content;
            if (content) {
                Object.entries(content).forEach(([type, mediaType]) => {
                    desc += `**Content-Type:** \`${type}\`\n\n`;
                    if (mediaType.schema) {
                        // Avoid circular reference stringify issues if schema is complex
                        try {
                            desc += `Schema: \`\`\`json\n${JSON.stringify(mediaType.schema, null, 2)}\n\`\`\`\n\n`;
                        } catch {
                            desc += `Schema: [Complex Schema]\n\n`;
                        }
                    }
                });
            }
        }

        // Responses
        if (operation.responses) {
            desc += `#### Responses\n\n`;
            Object.entries(operation.responses).forEach(([status, response]) => {
                desc += `**${status}** ${response.description || ''}\n\n`;
                if (response.content) {
                    Object.entries(response.content).forEach(([type, mediaType]) => {
                        if (mediaType.schema) {
                            try {
                                desc += `Schema (${type}): \`\`\`json\n${JSON.stringify(mediaType.schema, null, 2)}\n\`\`\`\n\n`;
                            } catch {
                                desc += `Schema (${type}): [Complex Schema]\n\n`;
                            }
                        }
                    });
                }
            });
        }

        return desc;
    }

    private static extractExamples(operation: OpenApiOperation): ApiExample[] {
        const examples: ApiExample[] = [];
        if (!operation.responses) return examples;

        // Snapshot of the request configuration to be included in the example
        const requestSnapshot = {
            queryParams: [] as KeyValueItem[],
            headers: [] as KeyValueItem[],
            body: undefined as ApiRequestBody | undefined
        };

        // Extract params for snapshot
        if (operation.parameters) {
            operation.parameters.forEach((p) => {
                if (p.in === 'query') {
                    requestSnapshot.queryParams.push({
                        id: uuidv4(),
                        key: p.name,
                        value: typeof p.example === 'string' ? p.example : '',
                        description: p.description,
                        isEnabled: true
                    });
                } else if (p.in === 'header') {
                    requestSnapshot.headers.push({
                        id: uuidv4(),
                        key: p.name,
                        value: typeof p.example === 'string' ? p.example : '',
                        description: p.description,
                        isEnabled: true
                    });
                }
            });
        }

        // Extract Body for snapshot
        if (operation.requestBody && operation.requestBody.content) {
            const content = operation.requestBody.content;
            if (content['application/json']) {
                requestSnapshot.body = {
                    type: 'raw',
                    rawType: 'JSON',
                    raw: '{}'
                };
                try {
                    const schema = content['application/json'].schema;
                    if (schema && schema.example) {
                        requestSnapshot.body.raw = JSON.stringify(schema.example, null, 2);
                    }
                } catch {}
            }
            // Add other body types if needed, for now JSON is most common
        }

        Object.entries(operation.responses).forEach(([status, response]) => {
            if (response.content) {
                Object.entries(response.content).forEach(([type, mediaType]) => {
                    // Check for 'example'
                    if (mediaType.schema?.example) {
                        examples.push({
                            id: uuidv4(),
                            name: `${status} - ${type}`,
                            status: parseInt(status) || 200,
                            body:
                                typeof mediaType.schema.example === 'string'
                                    ? mediaType.schema.example
                                    : JSON.stringify(mediaType.schema.example, null, 2),
                            request: requestSnapshot // Include request snapshot
                        });
                    }
                    // Check for 'examples'
                    // Note: OpenAPI v3 supports 'examples' map, but our OpenApiMediaType definition needs update if we want to support it fully.
                    // For now, let's stick to simple example in schema or we can extend types.
                });
            }
        });
        return examples;
    }

    static parseCurl(content: string): ApiRequest[] {
        // Basic cURL parsing using curlconverter
        try {
            const requests = curlconverter.toJsonString(content);
            const parsed = JSON.parse(requests);

            if (Array.isArray(parsed)) {
                return parsed.map((req: unknown) => {
                    const r = req as CurlRequest;
                    return {
                        id: uuidv4(),
                        name: 'Imported cURL',
                        type: 'request',
                        method: (
                            r.method || (r.data || r.body || r.multipartUploads ? 'POST' : 'GET')
                        ).toUpperCase() as RequestMethod,
                        url: r.url,
                        headers: r.headers
                            ? Object.entries(r.headers).map(([k, v]) => ({
                                  id: uuidv4(),
                                  key: k,
                                  value: String(v),
                                  isEnabled: true
                              }))
                            : [],
                        queryParams: r.queries
                            ? Object.entries(r.queries).map(([k, v]) => ({
                                  id: uuidv4(),
                                  key: k,
                                  value: String(v),
                                  isEnabled: true
                              }))
                            : [],
                        body: r.data
                            ? { type: 'raw', raw: typeof r.data === 'string' ? r.data : JSON.stringify(r.data) }
                            : { type: 'none' }
                    } as ApiRequest;
                });
            } else {
                // Single request
                const req = parsed as CurlRequest;
                return [
                    {
                        id: uuidv4(),
                        name: 'Imported cURL',
                        type: 'request',
                        method: (
                            req.method || (req.data || req.body || req.multipartUploads ? 'POST' : 'GET')
                        ).toUpperCase() as RequestMethod,
                        url: req.url,
                        headers: req.headers
                            ? Object.entries(req.headers).map(([k, v]) => ({
                                  id: uuidv4(),
                                  key: k,
                                  value: String(v),
                                  isEnabled: true
                              }))
                            : [],
                        queryParams: req.queries
                            ? Object.entries(req.queries).map(([k, v]) => ({
                                  id: uuidv4(),
                                  key: k,
                                  value: String(v),
                                  isEnabled: true
                              }))
                            : [],
                        body: req.data
                            ? { type: 'raw', raw: typeof req.data === 'string' ? req.data : JSON.stringify(req.data) }
                            : { type: 'none' }
                    } as ApiRequest
                ];
            }
        } catch (e) {
            console.error(`cURL import failed: ${e}`);
            return [];
        }
    }
}
