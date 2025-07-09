import { useGlobalUI } from './GlobalUI';

// Toast ヘルパー関数
export const showSuccessToast = (message: string, timeout?: number) => {
    const { showToast } = useGlobalUI();
    showToast({
        message,
        type: 'success',
        timeout
    });
};

export const showErrorToast = (message: string, timeout?: number) => {
    const { showToast } = useGlobalUI();
    showToast({
        message,
        type: 'error',
        timeout
    });
};

// すべてのトーストを非表示にする関数
export const hideAllToasts = () => {
    const { hideAllToasts: hideAll } = useGlobalUI();
    hideAll();
};

// Modal ヘルパー関数
export const showModal = (
    options: {
        title?: string;
        content?: string;
        component?: any;
        props?: Record<string, any>;
        type?: 'info' | 'warning' | 'error' | 'success';
        closable?: boolean;
        maxWidth?: string;
        persistent?: boolean;
    },
    onClose?: () => void
) => {
    const { showModal: showModalFunc } = useGlobalUI();
    showModalFunc(options, onClose);
};

export const showComponentModal = (
    component: any,
    props: Record<string, any> = {},
    options: {
        title?: string;
        type?: 'info' | 'warning' | 'error' | 'success';
        closable?: boolean;
        maxWidth?: string;
        persistent?: boolean;
    } = {},
    onClose?: () => void
) => {
    const { showModal } = useGlobalUI();
    showModal({
        component,
        props,
        ...options
    }, onClose);
};

export const showConfirmModal = (
    title: string,
    content: string,
    onClose?: () => void,
    options: {
        type?: 'info' | 'warning' | 'error' | 'success';
        closable?: boolean;
    } = {}
) => {
    const { showModal } = useGlobalUI();
    showModal({
        title,
        content,
        type: options.type || 'info',
        closable: options.closable !== false
    }, onClose);
};

export const showWarningModal = (
    title: string,
    content: string,
    onClose?: () => void,
    options: {
        closable?: boolean;
    } = {}
) => {
    const { showModal } = useGlobalUI();
    showModal({
        title,
        content,
        type: 'warning',
        closable: options.closable !== false
    }, onClose);
};

export const showErrorModal = (
    title: string,
    content: string,
    onClose?: () => void,
    options: {
        closable?: boolean;
    } = {}
) => {
    const { showModal } = useGlobalUI();
    showModal({
        title,
        content,
        type: 'error',
        closable: options.closable !== false
    }, onClose);
};

export const showSuccessModal = (
    title: string,
    content: string,
    onClose?: () => void,
    options: {
        closable?: boolean;
    } = {}
) => {
    const { showModal } = useGlobalUI();
    showModal({
        title,
        content,
        type: 'success',
        closable: options.closable !== false
    }, onClose);
};

// モーダルにデータを送信する関数
export const sendModalData = (data: any) => {
    const { sendModalData: sendData } = useGlobalUI();
    sendData(data);
};

// 使用例:
// import { showSuccessToast, showErrorToast, showComponentModal, showConfirmModal, hideAllToasts } from '@/composables/GlobalUIHelpers';
// 
// // Toast の表示（複数同時表示可能）
// showSuccessToast('処理が完了しました');
// showErrorToast('エラーが発生しました');
// showSuccessToast('別の処理も完了しました');
// 
// // すべてのトーストを非表示
// hideAllToasts();
// 
// // コンポーネントモーダルの表示
// showComponentModal(
//     MyComponent,
//     { prop1: 'value1', prop2: 'value2' },
//     { 
//         title: 'カスタムモーダル',
//         closable: true,        // 閉じるボタンとオーバーレイクリックを有効化
//         maxWidth: '800px',
//         persistent: true
//     },
//     () => { /* 閉じる時の処理 */ }
// );
// 
// // 確認モーダルの表示
// showConfirmModal(
//     '確認',
//     '本当に削除しますか？',
//     () => { /* 閉じる時の処理 */ },
//     { closable: true }        // 閉じるボタンとオーバーレイクリックを有効化
// ); 