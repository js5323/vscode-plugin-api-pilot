import * as vscode from "vscode";

export class ExamplePanel {
  public static currentPanels = new Map<string, ExamplePanel>();
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _context: vscode.ExtensionContext;
  private _disposables: vscode.Disposable[] = [];
  private readonly _exampleId?: string;

  public static createOrShow(context: vscode.ExtensionContext, data?: any) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // Handle data being either the example object or { example: ..., parentRequest: ... }
    const example = data?.example || data;

    // If we have an example ID, check if we already have a panel for it
    if (example && example.id) {
        const existingPanel = ExamplePanel.currentPanels.get(example.id);
        if (existingPanel) {
            existingPanel._panel.reveal(column);
            return;
        }
    }

    const panel = vscode.window.createWebviewPanel(
      "apipilot-example",
      example ? `${example.name}` : "Example",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, "src", "webview", "dist"),
        ],
        retainContextWhenHidden: true
      }
    );

    const examplePanel = new ExamplePanel(panel, context, data);
    
    if (example && example.id) {
        ExamplePanel.currentPanels.set(example.id, examplePanel);
    }
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, data?: any) {
    this._panel = panel;
    this._extensionUri = context.extensionUri;
    this._context = context;
    
    const example = data?.example || data;
    this._exampleId = example?.id;

    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, data);

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
            case "onInfo": {
                if (!message.value) return;
                vscode.window.showInformationMessage(message.value);
                break;
            }
            case "onError": {
                if (!message.value) return;
                vscode.window.showErrorMessage(message.value);
                break;
            }
            case "log": {
                 console.log(`Log from ExamplePanel: ${message.value}`);
                 break;
            }
            case "openRequest": {
                // Forward openRequest to the main extension logic
                vscode.commands.executeCommand('apipilot.openRequest', message.payload);
                break;
            }
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    if (this._exampleId) {
        ExamplePanel.currentPanels.delete(this._exampleId);
    }
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview, initialData?: any) {
    const isDev = this._context.extensionMode === vscode.ExtensionMode.Development;
    
    let scriptUri = "";
    let styleResetUri = "";

    if (isDev) {
        scriptUri = "http://localhost:5173/src/main.tsx";
        styleResetUri = "http://localhost:5173/src/index.css"; 
    } else {
        scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "src", "webview", "dist", "assets", "index.js")
        ).toString();
        styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "src", "webview", "dist", "assets", "index.css")
        ).toString();
    }

    const nonce = getNonce();
    
    const initialDataScript = initialData 
        ? `window.initialData = ${JSON.stringify(initialData)};` 
        : '';

    const csp = isDev 
        ? `default-src 'none'; connect-src ${webview.cspSource} https: http://localhost:5173 ws://localhost:5173 data:; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline' http://localhost:5173; script-src ${webview.cspSource} 'nonce-${nonce}' 'unsafe-eval' http://localhost:5173; font-src ${webview.cspSource} https: data:;`
        : `default-src 'none'; connect-src ${webview.cspSource} https: data:; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}' 'unsafe-eval'; font-src ${webview.cspSource} https: data:;`;

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="${csp}">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				${!isDev ? `<link href="${styleResetUri}" rel="stylesheet">` : ''}
				<title>ApiPilot Example</title>
                <script nonce="${nonce}">
                    window.viewType = 'example-editor';
                    ${initialDataScript}
                </script>
                 <script nonce="${nonce}">
                    // Acquire API once and store globally
                    try {
                        const vscode = acquireVsCodeApi();
                        window.vscode = vscode;
                    } catch (e) {
                        console.error("Failed to acquire vscode api", e);
                    }
                    const vscode = window.vscode;

                     // Override console.log
                    const originalLog = console.log;
                    console.log = function(...args) {
                        originalLog.apply(console, args);
                        if (vscode) {
                            vscode.postMessage({ type: 'log', value: args.join(' ') });
                        }
                    };
                </script>
                ${isDev ? `
                    <script type="module" nonce="${nonce}">
                        import RefreshRuntime from "http://localhost:5173/@react-refresh"
                        RefreshRuntime.injectIntoGlobalHook(window)
                        window.$RefreshReg$ = () => {}
                        window.$RefreshSig$ = () => (type) => type
                        window.__vite_plugin_react_preamble_installed__ = true
                    </script>
                    <script type="module" nonce="${nonce}" src="http://localhost:5173/@vite/client"></script>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                ` : `
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                `}
			</head>
			<body>
				<div id="root"></div>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
