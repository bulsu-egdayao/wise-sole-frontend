import React, { useState, useCallback } from "react";

interface DialogState {
  mode: "confirm" | "alert";
  message: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

interface ConfirmOptions {
  danger?: boolean; // true = red "Delete" button instead of black "Confirm"
}

export function useConfirm() {
  const [state, setState] = useState<DialogState | null>(null);

  const confirm = useCallback((message: string, options?: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ mode: "confirm", message, danger: options?.danger ?? false, resolve });
    });
  }, []);

  // Notice-style popup, styled the same as confirm() (Cancel + red button).
  // Both buttons simply dismiss it — there's nothing to actually confirm.
  const notify = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      setState({ mode: "alert", message, danger: true, resolve: () => resolve() });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  const ConfirmDialog = state ? (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleCancel} />
      <div className="relative bg-white max-w-[380px] w-full p-6 shadow-xl">
        <p className="text-[14px] leading-relaxed mb-6 whitespace-pre-line">{state.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="text-[11px] tracking-[0.08em] uppercase border border-[#EAEAEA] px-4 py-2.5 hover:border-black transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`text-[11px] tracking-[0.08em] uppercase px-4 py-2.5 transition-colors duration-200 ${
              state.danger
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-black text-white hover:bg-[#1a1a1a]"
            }`}
          >
            {state.mode === "alert" ? "Delete" : state.danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, notify, ConfirmDialog };
}