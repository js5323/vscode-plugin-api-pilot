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
        duration?: number;
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
        duration?: number;
    };
}

export interface ClientCertificate {
    host: string;
    crt: string;
    key: string;
    pfx: string;
    passphrase?: string;
}

export interface ExampleInitialData {
    example?: ApiExample;
    parentRequest?: ApiRequest;
    _folderPath?: { id: string; name: string }[];
    _parentRequestName?: string;
    [key: string]: unknown;
}

export type WebviewInitialData =
    | (ApiRequest & { viewType?: 'editor' })
    | (ExampleInitialData & { viewType?: 'example-editor' })
    | (Environment & { viewType?: 'environment-editor' })
    | undefined;

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

// Message Types
export interface LogMessage {
    type: 'log';
    value: string;
}
export interface InfoMessage {
    type: 'onInfo';
    value: string;
}
export interface ErrorMessage {
    type: 'onError';
    value: string;
}
export interface CloseMessage {
    type: 'close';
}
export interface GetCollectionsMessage {
    type: 'getCollections';
}
export interface ImportDataMessage {
    type: 'importData';
    payload: { collectionId?: string; newCollectionName?: string; content: string };
}
export interface ExecuteRequestMessage {
    type: 'executeRequest';
    payload: ApiRequest;
}
export interface UpdateTitleMessage {
    type: 'updateTitle';
    value: string;
}
export interface GenerateCodeMessage {
    type: 'generateCode';
    payload: { request: ApiRequest; language: string };
}
export interface SelectFileMessage {
    type: 'selectFile';
    context?: string;
}
export interface SaveRequestMessage {
    type: 'saveRequest';
    payload: ApiRequest;
}
export interface GetSettingsMessage {
    type: 'getSettings';
}
export interface SaveSettingsMessage {
    type: 'saveSettings';
    payload: { settings: Settings; defaultEnvId: string };
}
export interface CreateEnvironmentMessage {
    type: 'createEnvironment';
}
export interface DeleteEnvironmentMessage {
    type: 'deleteEnvironment';
    payload: string;
}
export interface EditEnvironmentMessage {
    type: 'editEnvironment';
    payload: Environment;
}
export interface ExportDataMessage {
    type: 'exportData';
}
export interface OpenRequestMessage {
    type: 'openRequest';
    payload: ApiRequest | string;
}
export interface SaveEnvironmentMessage {
    type: 'saveEnvironment';
    payload: Environment;
}

export interface ReadClipboardMessage {
    type: 'readClipboard';
}

export type CommonMessage = LogMessage | InfoMessage | ErrorMessage;

export type ImportPanelMessage = CommonMessage | CloseMessage | GetCollectionsMessage | ImportDataMessage;
export interface GenerateCodeSnippetMessage {
    type: 'generateCodeSnippet';
    payload: { request: ApiRequest; language: string };
}

export type SettingsPanelMessage =
    | LogMessage
    | GetSettingsMessage
    | SaveSettingsMessage
    | CreateEnvironmentMessage
    | DeleteEnvironmentMessage
    | EditEnvironmentMessage
    | SelectFileMessage
    | ImportDataMessage
    | ExportDataMessage;

export type WebviewMessage =
    | ImportPanelMessage
    | RequestPanelMessage
    | SettingsPanelMessage
    | ExamplePanelMessage
    | EnvironmentPanelMessage;

export interface RequestPanelMessage {
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
    value?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: any;
}

export interface EnvironmentPanelMessage {
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
    value?: string;
}

export interface ExamplePanelMessage {
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
    value?: string;
}

export interface CurlSettings {
    multiline: boolean;
    longForm: boolean;
    lineContinuation: '\\' | '^' | '`';
    quoteType: 'single' | 'double';
    timeout: number;
    followRedirects: boolean;
    silent: boolean;
}

export const DEFAULT_CURL_SETTINGS: CurlSettings = {
    multiline: true,
    longForm: true,
    lineContinuation: '\\',
    quoteType: 'single',
    timeout: 0,
    followRedirects: true,
    silent: false
};
