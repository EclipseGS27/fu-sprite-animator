/* Minimal ambient declarations for the Foundry VTT v13 globals this module touches.
 * Typed loosely on purpose: only src/foundry uses them, and every use is guarded at runtime. */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const game: any;
declare const Hooks: any;
declare const foundry: any;
declare const ui: any;
declare const canvas: any;
declare const CONFIG: any;
declare const Actor: any;
declare const TokenDocument: any;
