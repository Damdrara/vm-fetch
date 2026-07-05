export {};

declare global {
    /**
     * The page's real window object.
     * Provided by userscript managers such as Violentmonkey/Tampermonkey.
     */
    const unsafeWindow: Window & typeof globalThis;
}