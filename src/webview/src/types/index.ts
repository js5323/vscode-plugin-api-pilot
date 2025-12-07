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

export interface ApiRequest {
    id: string;
    name: string;
    method: RequestMethod;
    url: string;
    headers?: KeyValueItem[];
    body?: ApiRequestBody;
    queryParams?: KeyValueItem[];
    auth?: any;
    description?: string;
    type: 'request';
    parentId?: string; // ID of parent folder or collection, or undefined if root
    examples?: ApiExample[];
    responseHistory?: any[];
}

export interface ApiExample {
    id: string;
    name: string;
    status: number;
    body: string;
}

export interface CollectionFolder {
    id: string;
    name: string;
    type: 'folder';
    children: (CollectionFolder | ApiRequest)[];
    parentId?: string; // ID of parent folder, or undefined if root collection
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
}
