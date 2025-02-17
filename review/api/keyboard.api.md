## API Report File for "@lumino/keyboard"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @public
export const EN_US: IKeyboardLayout;

// @public
export function getKeyboardLayout(): IKeyboardLayout;

// @public
export interface IKeyboardLayout {
    isModifierKey(key: string): boolean;
    isValidKey(key: string): boolean;
    keyForKeydownEvent(event: KeyboardEvent): string;
    keys(): string[];
    readonly name: string;
}

// @public
export class KeycodeLayout implements IKeyboardLayout {
    constructor(name: string, codes: KeycodeLayout.CodeMap, modifierKeys?: string[]);
    isModifierKey(key: string): boolean;
    isValidKey(key: string): boolean;
    keyForKeydownEvent(event: KeyboardEvent): string;
    keys(): string[];
    readonly name: string;
}

// @public
export namespace KeycodeLayout {
    export type CodeMap = {
        readonly [code: number]: string;
    };
    export function convertToKeySet(keys: string[]): KeySet;
    export function extractKeys(codes: CodeMap): KeySet;
    export type KeySet = {
        readonly [key: string]: boolean;
    };
}

// @public
export function setKeyboardLayout(layout: IKeyboardLayout): void;

// (No @packageDocumentation comment for this package)

```
