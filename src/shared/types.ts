export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface KeyValueItem {
    id: string;
    key: string;
    value: string;
    type?: 'text' | 'file';
    description?: string;
    isEnabled: boolean;
}

export interface ApiRequestBody {
    type: 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql';
    raw?: string;
    rawType?: 'Text' | 'JavaScript' | 'JSON' | 'HTML' | 'XML';
    formData?: KeyValueItem[];
    urlencoded?: KeyValueItem[];
    binary?: string;
    graphql?: {
        query: string;
        variables: string;
    };
}

export interface ApiExample {
    id: string;
    name: string;
    status: number;
    body: string;
    request?: {
        queryParams?: KeyValueItem[];
        headers?: KeyValueItem[];
        body?: ApiRequestBody;
        method?: string;
        url?: string;
    };
}

export interface ApiRequest {
    id: string;
    name: string;
    method: RequestMethod;
    url: string;
    headers?: KeyValueItem[];
    body?: ApiRequestBody;
    queryParams?: KeyValueItem[];
    auth?: {
        type: 'none' | 'basic' | 'bearer';
        basic?: { username: string; password: string };
        bearer?: { token: string };
    };
    description?: string;
    type: 'request';
    parentId?: string;
    examples?: ApiExample[];
    responseHistory?: {
        status: number;
        statusText: string;
        time: number;
        size: number;
    }[];
    _folderPath?: { id: string; name: string }[];
}

export interface CollectionFolder {
    id: string;
    name: string;
    type: 'folder';
    children: (CollectionFolder | ApiRequest)[];
    parentId?: string;
    childrenOrder?: string[];
}

export type CollectionItem = CollectionFolder | ApiRequest;

export interface Environment {
    id: string;
    name: string;
    variables: KeyValueItem[];
    isActive: boolean;
}

export interface HistoryItem extends ApiRequest {
    timestamp: number;
    response?: {
        status: number;
        statusText: string;
        time: number;
        size: number;
    };
}

export interface ClientCertificate {
    host: string;
    crt: string;
    key: string;
    pfx: string;
    passphrase?: string;
}

export interface Settings {
    general: {
        timeout: number;
        maxResponseSize: number;
        sslVerification: boolean;
        autoSave: boolean;
        defaultHeaders: KeyValueItem[];
    };
    proxy: {
        useSystemProxy: boolean;
        protocol: string;
        host: string;
        port: string;
        auth: boolean;
        username: string;
        password: string;
        bypass: string;
    };
    certificates: {
        ca: string[];
        client: ClientCertificate[];
    };
    theme?: 'light' | 'dark' | 'system';
}

export interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
    size: number;
    time: number;
    timestamp?: number;
}

export interface BackupData {
    version: number;
    timestamp: number;
    data: {
        collections: CollectionItem[];
        environments: Environment[];
        settings: Settings;
        history: HistoryItem[];
    };
}
