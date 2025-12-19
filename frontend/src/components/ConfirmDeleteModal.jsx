// frontend/src/components/ConfirmDeleteModal.jsx
import React from "react";
import ModalPortal from "./ModalPortal";

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center">

        {/* BLUR TOTAL */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-md z-[99999]"
          onClick={onCancel}
        ></div>

        {/* JANELA */}
        <div className="relative z-[100001] bg-white rounded-3xl shadow-2xl p-7 w-[380px] text-center 
                        border border-white/20 animate-[fadeSlide_0.25s_ease-out]">

          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {title || "Confirmação"}
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {message}
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition shadow-sm"
            >
              Cancelar
            </button>

            <button
              onClick={onConfirm}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md transition"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
