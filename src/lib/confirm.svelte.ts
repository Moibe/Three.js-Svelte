type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type State = ConfirmOptions & {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
};

function createConfirm() {
  let state = $state<State>({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    danger: false,
    resolve: null
  });

  return {
    get state() {
      return state;
    },
    ask(opts: ConfirmOptions): Promise<boolean> {
      return new Promise<boolean>((resolve) => {
        if (state.resolve) state.resolve(false);
        state.title = opts.title ?? 'Confirmar';
        state.message = opts.message;
        state.confirmText = opts.confirmText ?? 'Eliminar';
        state.cancelText = opts.cancelText ?? 'Cancelar';
        state.danger = opts.danger ?? true;
        state.resolve = resolve;
        state.open = true;
      });
    },
    accept() {
      state.resolve?.(true);
      state.resolve = null;
      state.open = false;
    },
    cancel() {
      state.resolve?.(false);
      state.resolve = null;
      state.open = false;
    }
  };
}

export const confirmStore = createConfirm();
