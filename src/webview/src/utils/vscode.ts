interface VSCodeApi {
    postMessage(message: unknown): void;
    setState(state: unknown): void;
    getState(): unknown;
}

declare global {
    interface Window {
        vscode?: VSCodeApi;
        acquireVsCodeApi?: () => VSCodeApi;
    }
}

export const getVsCodeApi = (): VSCodeApi => {
    if (window.vscode) {
        return window.vscode;
    }
    if (window.acquireVsCodeApi) {
        window.vscode = window.acquireVsCodeApi();
        return window.vscode;
    }
    return {
        postMessage: (msg: unknown) => console.log('Mock PostMessage:', msg),
        setState: (state: unknown) => console.log('Mock SetState:', state),
        getState: () => ({})
    };
};
