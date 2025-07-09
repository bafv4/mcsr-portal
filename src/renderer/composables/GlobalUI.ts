import { defineStore } from "pinia";
import { ref, reactive } from "vue";

export interface ToastOptions {
    message: string;
    type?: 'error' | 'success';
    timeout?: number;
    position?: 'fixed' | 'relative';
}

export interface ToastItem {
    id: string;
    message: string;
    type: 'error' | 'success';
    timeout: number;
    position: 'fixed' | 'relative';
    show: boolean;
}

export interface ModalOptions {
    title?: string;
    content?: string;
    component?: any;
    props?: Record<string, any>;
    type?: 'info' | 'warning' | 'error' | 'success';
    closable?: boolean;
    maxWidth?: string;
    persistent?: boolean;
}

export const useGlobalUI = defineStore('globalUI', () => {
    // Toast state - 複数のトーストを管理
    const toasts = ref<ToastItem[]>([]);
    const maxToasts = 3;

    // Modal state
    const modal = reactive({
        show: false,
        title: '',
        content: '',
        component: null as any,
        props: {} as Record<string, any>,
        type: 'info' as 'info' | 'warning' | 'error' | 'success',
        closable: true,
        maxWidth: '440px',
        persistent: false,
        onClose: null as (() => void) | null
    });

    // Toast actions
    const showToast = (options: ToastOptions) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const toast: ToastItem = {
            id,
            message: options.message,
            type: options.type || 'error',
            timeout: options.timeout || 3500,
            position: options.position || 'fixed',
            show: true
        };

        // 最大数を超える場合は古いトーストを削除
        if (toasts.value.length >= maxToasts) {
            toasts.value.shift();
        }

        toasts.value.push(toast);

        // タイムアウト設定
        setTimeout(() => {
            hideToast(id);
        }, toast.timeout);
    };

    const hideToast = (id: string) => {
        const toast = toasts.value.find(t => t.id === id);
        if (toast) {
            toast.show = false;
            // アニメーション完了後に配列から削除
            setTimeout(() => {
                const index = toasts.value.findIndex(t => t.id === id);
                if (index > -1) {
                    toasts.value.splice(index, 1);
                }
            }, 300); // アニメーション時間に合わせる
        }
    };

    const hideAllToasts = () => {
        toasts.value.forEach(toast => {
            toast.show = false;
        });
        setTimeout(() => {
            toasts.value = [];
        }, 300);
    };

    // Modal actions
    const showModal = (options: ModalOptions, onClose?: () => void) => {
        modal.title = options.title || '';
        modal.content = options.content || '';
        modal.component = options.component || null;
        modal.props = options.props || {};
        modal.type = options.type || 'info';
        modal.closable = options.closable !== false;
        modal.maxWidth = options.maxWidth || '440px';
        modal.persistent = options.persistent || false;
        modal.onClose = onClose || null;
        modal.show = true;
    };

    const hideModal = () => {
        modal.show = false;
        modal.component = null;
        modal.props = {};
        modal.onClose = null;
    };

    const closeModal = () => {
        if (modal.onClose) {
            modal.onClose();
        }
        hideModal();
    };

    // モーダルにデータを送信する関数
    const sendModalData = (data: any) => {
        if (modal.component && modal.props) {
            Object.assign(modal.props, data);
        }
    };

    return {
        // State
        toasts,
        modal,
        
        // Toast actions
        showToast,
        hideToast,
        hideAllToasts,
        
        // Modal actions
        showModal,
        hideModal,
        closeModal,
        sendModalData
    };
}); 