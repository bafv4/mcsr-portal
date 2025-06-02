/// <reference types="vite/client" />

declare module '*.vue' {
    import { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

declare module '*.yml' {
    const value: Record<string, any>;
    export default value;
}

declare module 'vuetify/styles' {
  const content: any;
  export default content;
}