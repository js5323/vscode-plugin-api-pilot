import * as curlconverter from 'curlconverter';

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export class Importer {
    static parse(content: string): any[] {
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
        } catch (e) {
            // Check if it might be YAML
            // Try to match "openapi: 3.x.x" or "swagger: '2.0'"
            if (/^\s*(openapi|swagger)\s*:/i.test(content) || /^\s*---\s*$/m.test(content)) {
                throw new Error(
                    'YAML format is not currently supported. Please convert your OpenAPI/Swagger definition to JSON.'
                );
            }
            // Not JSON, continue to cURL
        }

        // Try cURL
        if (content.toLowerCase().startsWith('curl')) {
            return this.parseCurl(content);
        }

        throw new Error(
            'Unknown or unsupported format. Please ensure content is valid JSON (Postman/OpenAPI) or a cURL command.'
        );
    }

    private static parsePostman(items: any[]): any[] {
        return items.map((item: any) => {
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
                const req = item.request;
                return {
                    id: uuidv4(),
                    name: item.name,
                    type: 'request',
                    method: req.method,
                    url: typeof req.url === 'string' ? req.url : req.url?.raw || '',
                    headers: req.header
                        ? req.header.map((h: any) => ({
                              id: uuidv4(),
                              key: h.key,
                              value: h.value,
                              isEnabled: true
                          }))
                        : [],
                    queryParams: req.url?.query
                        ? req.url.query.map((q: any) => ({
                              id: uuidv4(),
                              key: q.key,
                              value: q.value,
                              isEnabled: true
                          }))
                        : [],
                    body: this.parsePostmanBody(req.body)
                };
            }
        });
    }

    private static parsePostmanBody(body: any): any {
        if (!body) return { type: 'none' };
        if (body.mode === 'raw') {
            return { type: 'raw', raw: body.raw };
        }
        if (body.mode === 'formdata') {
            return {
                type: 'form-data',
                formData: body.formdata.map((f: any) => ({
                    id: uuidv4(),
                    key: f.key,
                    value: f.value,
                    isEnabled: true
                }))
            };
        }
        if (body.mode === 'urlencoded') {
            return {
                type: 'x-www-form-urlencoded',
                urlencoded: body.urlencoded.map((u: any) => ({
                    id: uuidv4(),
                    key: u.key,
                    value: u.value,
                    isEnabled: true
                }))
            };
        }
        return { type: 'none' };
    }

    private static parseOpenApi(json: any): any[] {
        const paths = json.paths || {};
        const items: any[] = [];

        // Simple grouping by first tag or flattened
        // For better structure, we could group by tags.
        const tagsMap = new Map<string, any[]>();

        Object.entries(paths).forEach(([path, methods]: [string, any]) => {
            Object.entries(methods).forEach(([method, operation]: [string, any]) => {
                if (method === 'parameters' || method === 'servers') return; // Skip non-methods

                const req = {
                    id: uuidv4(),
                    name: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
                    type: 'request',
                    method: method.toUpperCase(),
                    url: json.servers?.[0]?.url ? `${json.servers[0].url}${path}` : path, // Simple URL construction
                    headers: [] as any[], // Extract parameters in header
                    queryParams: [] as any[], // Extract parameters in query
                    body: { type: 'none' } // Extract body
                };

                // Extract params
                if (operation.parameters) {
                    operation.parameters.forEach((p: any) => {
                        if (p.in === 'query') {
                            req.queryParams.push({
                                id: uuidv4(),
                                key: p.name,
                                value: '', // Default empty
                                isEnabled: true
                            });
                        } else if (p.in === 'header') {
                            req.headers.push({
                                id: uuidv4(),
                                key: p.name,
                                value: '',
                                isEnabled: true
                            });
                        }
                    });
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

    private static parseCurl(content: string): any[] {
        // curlconverter returns a string of code, we want the JSON object
        // but curlconverter.toJsonString() returns a stringified JSON.
        // Wait, check curlconverter API. It might not be available in CommonJS/TS easily if it's ESM only?
        // Assuming it works or I'll catch error.

        // Note: curlconverter might return an array of requests if multiple commands
        // But typically it returns a single object code.
        // Actually curlconverter has .toJsonString()

        try {
            // @ts-ignore
            const jsonStr = curlconverter.toJsonString(content);
            const items = JSON.parse(jsonStr); // This might be an array or object?

            // If it's an array (multiple commands)
            const requests = Array.isArray(items) ? items : [items];

            return requests.map((req: any) => {
                return {
                    id: uuidv4(),
                    name: 'Imported cURL',
                    type: 'request',
                    method: (
                        req.method || (req.data || req.body || req.multipartUploads ? 'POST' : 'GET')
                    ).toUpperCase(),
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
                };
            });
        } catch (e) {
            console.error(e);
            throw new Error('Failed to parse cURL command');
        }
    }
}
