export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface ApiRequest {
    id: string;
    name: string;
    method: RequestMethod;
    url: string;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string>;
    auth?: any;
    type: 'request';
    parentId?: string; // ID of parent folder or collection, or undefined if root
    examples?: any[];
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
    variables: Record<string, string>;
    isActive: boolean;
}

export interface HistoryItem extends ApiRequest {
    timestamp: number;
}
