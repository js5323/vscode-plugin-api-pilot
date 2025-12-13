import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import { RequestPanel } from './RequestPanel';
import { EnvironmentPanel } from './EnvironmentPanel';
import { Logger } from './utils/Logger';

export function activate(context: vscode.ExtensionContext) {
    Logger.initialize('ApiPilot Debug');
    Logger.log('ApiPilot is now active!');

    const sidebarProvider = new SidebarProvider(context);

    context.subscriptions.push(vscode.window.registerWebviewViewProvider('apipilot-sidebar', sidebarProvider));

    context.subscriptions.push(
        vscode.commands.registerCommand('apipilot.start', () => {
            vscode.window.showInformationMessage('ApiPilot Started');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('apipilot.createRequest', () => {
            RequestPanel.createOrShow(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('apipilot.openEnvironment', (environment) => {
            EnvironmentPanel.createOrShow(context, environment);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('apipilot.refreshSidebar', () => {
            sidebarProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('apipilot.refreshHistory', () => {
            sidebarProvider.refreshHistory();
        })
    );
}

export function deactivate() {}
