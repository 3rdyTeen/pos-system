import { create } from 'zustand';

export type ToastVariant = 'success' | 'error';

export interface Toast {
    id: number;
    variant: ToastVariant;
    message: string;
}

interface ToastState {
    toasts: Toast[];
    push: (variant: ToastVariant, message: string) => void;
    dismiss: (id: number) => void;
}

const DISMISS_AFTER = 4000;
let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
    toasts: [],
    push: (variant, message) => {
        const id = ++nextId;

        set((state) => ({ toasts: [...state.toasts, { id, variant, message }] }));

        setTimeout(() => get().dismiss(id), DISMISS_AFTER);
    },
    dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/**
 * Imperative helper usable from mutation callbacks (outside React).
 */
export const toast = {
    success: (message: string) => useToastStore.getState().push('success', message),
    error: (message: string) => useToastStore.getState().push('error', message),
};
