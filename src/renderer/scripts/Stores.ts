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