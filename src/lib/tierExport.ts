/**
 * PHASE 7: Export System
 * Export tier boards as PNG/JPEG images
 * 
 * Note: Install html2canvas for export: npm install html2canvas
 */

export async function exportTierBoardAsImage(
    elementId: string,
    filename: string = "tier-board",
    format: "png" | "jpeg" = "png"
): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error("Element not found");
    }

    try {
        // Try to use html2canvas if available
        let html2canvas: any;
        try {
            html2canvas = (await import("html2canvas")).default;
        } catch {
            // Fallback: Use canvas API directly
            alert("Export requires html2canvas. Install with: npm install html2canvas");
            return;
        }

        const canvas = await html2canvas(element, {
            backgroundColor: "#1a1a1a",
            scale: 2, // Higher resolution
            logging: false,
        });

        const dataUrl = canvas.toDataURL(`image/${format}`, 0.95);
        const link = document.createElement("a");
        link.download = `${filename}.${format}`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error("Export failed:", err);
        throw err;
    }
}
