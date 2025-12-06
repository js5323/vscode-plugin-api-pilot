
export const getVsCodeApi = () => {
    if ((window as any).vscode) {
        return (window as any).vscode;
    }
    if ((window as any).acquireVsCodeApi) {
        (window as any).vscode = (window as any).acquireVsCodeApi();
        return (window as any).vscode;
    }
    return {
        postMessage: (msg: any) => console.log('Mock PostMessage:', msg)
    };
};
