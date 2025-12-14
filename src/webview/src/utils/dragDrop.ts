export const setDragImage = (e: React.DragEvent | DragEvent, element: HTMLElement) => {
    // Create a clone to use as the drag image
    const clone = element.cloneNode(true) as HTMLElement;

    // Set styles to ensure it's visible but off-screen (or just used for the image)
    // We position it absolute top-left but with negative coordinates?
    // Actually, for setDragImage to work, it must be "visible".
    // A common trick is to place it at the bottom of the body, absolute.

    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none'; // Ensure it doesn't interfere

    // Copy computed width/height to ensure it looks the same
    const rect = element.getBoundingClientRect();
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;

    // Ensure background is opaque (VS Code themes might make it transparent)
    // We try to get the background color.
    const computedStyle = window.getComputedStyle(element);
    let bg = computedStyle.backgroundColor;
    if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
        // Fallback to a safe color or try to find a parent's color?
        // For sidebar items, usually they are transparent until hovered.
        // We want the drag image to look like the item.
        // Maybe force a background color?
        // 'background.paper' from theme is hard to get here without context.
        // Let's try to leave it or set a default.
        // If it's transparent, the text/icon will still be visible.
        // But maybe the "whole sidebar" issue was due to transparency and the browser grabbing the background?
        // Unlikely.
    }

    // Append to body
    document.body.appendChild(clone);

    // Set the drag image
    // The offset (0, 0) means the cursor will be at the top-left of the image.
    // We can center it vertically if we want, but 0,0 is standard.
    if (e.dataTransfer) {
        e.dataTransfer.setDragImage(clone, 0, 0);
    }

    // Remove the clone after a short delay to allow the browser to generate the bitmap
    setTimeout(() => {
        document.body.removeChild(clone);
    }, 0);
};
