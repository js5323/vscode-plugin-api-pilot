import { useState, useEffect } from 'react';

export type MonacoTheme = 'vs-dark' | 'light';

export function useVsCodeTheme(): MonacoTheme {
    const [theme, setTheme] = useState<MonacoTheme>('vs-dark');

    useEffect(() => {
        const updateTheme = () => {
            const body = document.body;
            // VS Code adds class 'vscode-light', 'vscode-dark', or 'vscode-high-contrast'
            if (body.classList.contains('vscode-light')) {
                setTheme('light');
            } else {
                setTheme('vs-dark');
            }
        };

        // Initial check
        updateTheme();

        // Observer for class attribute changes on body
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    return theme;
}
