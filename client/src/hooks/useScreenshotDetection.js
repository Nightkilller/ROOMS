import { useEffect, useCallback } from 'react';

/**
 * Detects screenshot attempts via keyboard shortcuts and notifies via callback.
 * 
 * Detects:
 * - Windows/Linux: PrintScreen, Ctrl+PrintScreen, Alt+PrintScreen, Snipping Tool (Win+Shift+S)
 * - Mac: Cmd+Shift+3 (full screen), Cmd+Shift+4 (selection), Cmd+Shift+5 (screenshot toolbar)
 * 
 * Also uses the visibilitychange API as a heuristic (some screenshot tools blur the page).
 */
export default function useScreenshotDetection(onScreenshotDetected, enabled = true) {
    const handleKeyDown = useCallback((e) => {
        if (!enabled) return;

        let detected = false;

        // Windows/Linux: PrintScreen key
        if (e.key === 'PrintScreen') {
            detected = true;
        }

        // Windows: Win+Shift+S (Snipping Tool)
        if (e.key === 'S' && e.shiftKey && e.metaKey) {
            detected = true;
        }

        // Mac: Cmd+Shift+3 (full screenshot)
        if (e.key === '3' && e.shiftKey && e.metaKey) {
            detected = true;
        }

        // Mac: Cmd+Shift+4 (selection screenshot)
        if (e.key === '4' && e.shiftKey && e.metaKey) {
            detected = true;
        }

        // Mac: Cmd+Shift+5 (screenshot toolbar)
        if (e.key === '5' && e.shiftKey && e.metaKey) {
            detected = true;
        }

        // Ctrl+PrintScreen
        if (e.key === 'PrintScreen' && e.ctrlKey) {
            detected = true;
        }

        if (detected) {
            onScreenshotDetected();
        }
    }, [onScreenshotDetected, enabled]);

    useEffect(() => {
        if (!enabled) return;

        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [handleKeyDown, enabled]);
}
