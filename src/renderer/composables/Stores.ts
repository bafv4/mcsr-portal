import { defineStore } from "pinia";

export const useDirStore = defineStore('dir', {
    state: () => ({
        dir: '',
        graalvm: ''
    }),
    actions: {
        set(d: string): void {
            this.dir = d;
        },
        get(): string {
            return this.dir;
        },
        isEmpty(): boolean {
            return this.dir == '';
        },
        setGraalvm(path: string): void {
            this.graalvm = path;
        },
        $reset() {
            this.dir = '';
            this.graalvm = '';
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

export const useInstanceStore = defineStore('instance', {
    state: () => ({
        launcherRoot: '',
        instanceName: '',
        memoryMin: 2048,
        memoryMax: 2048,
        useFabric: true,
        fabricVersion: '0.16.14',
        javaArgs: '',
        javaPath: '',
        selectedGroup: '',
        newGroupName: ''
    }),
    actions: {
        setLauncherRoot(path: string): void {
            this.launcherRoot = path;
        },
        getLauncherRoot(): string {
            return this.launcherRoot;
        },
        setInstanceName(name: string): void {
            this.instanceName = name;
        },
        getInstanceName(): string {
            return this.instanceName;
        },
        setMemory(min: number, max: number): void {
            this.memoryMin = min;
            this.memoryMax = max;
        },
        setUseFabric(use: boolean): void {
            this.useFabric = use;
        },
        setFabricVersion(version: string): void {
            this.fabricVersion = version;
        },
        setJavaArgs(args: string): void {
            this.javaArgs = args;
        },
        setJavaPath(path: string): void {
            this.javaPath = path;
        },
        setSelectedGroup(group: string): void {
            this.selectedGroup = group;
        },
        getSelectedGroup(): string {
            return this.selectedGroup;
        },
        setNewGroupName(name: string): void {
            this.newGroupName = name;
        },
        getNewGroupName(): string {
            return this.newGroupName;
        },
        $reset(): void {
            this.launcherRoot = '';
            this.instanceName = '';
            this.memoryMin = 2048;
            this.memoryMax = 2048;
            this.useFabric = true;
            this.fabricVersion = '0.16.14';
            this.javaArgs = '';
            this.javaPath = '';
            this.selectedGroup = '';
            this.newGroupName = '';
        }
    }
});