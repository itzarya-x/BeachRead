export const COMMAND_PALETTE_OPEN_EVENT = "yura:command-palette:open";

export function openCommandPalette(initialQuery = "") {
  window.dispatchEvent(
    new CustomEvent(COMMAND_PALETTE_OPEN_EVENT, {
      detail: { query: initialQuery },
    }),
  );
}
