import { defineStore } from "pinia";

export const useDirStore = defineStore('dir', {
    state: () => ({
        dir: ''
    }),
    actions: {
        set(d: string): void {
            this.dir = d;
        },
        get(): string {
            return this.dir;
        },
        isEmpty() :boolean {
            return this.dir==='';
        }
    }
});

export const useResourcesStore = defineStore('resources', {
    state: () => ({
        resources: new Array<string>,
    }),
    actions: {
        add(ids: string[]): void {
            this.resources.push(...ids);
        },
        get(): string[] {
            return this.resources;
        },
        includes(id: string): boolean {
            return this.resources.includes(id);
        }
    }
});

export const useModsStore = defineStore('mods', {
    state: () => ({
        mods: new Array<string>,
    }),
    actions: {
        add(ids: string[]): void {
            this.mods.push(...ids);
        },
        get(): string[] {
            return this.mods;
        },
        includes(id: string): boolean {
            return this.mods.includes(id);
        }
    }
});