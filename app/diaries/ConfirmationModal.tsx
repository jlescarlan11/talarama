// components/ConfirmationModal.tsx
// Optional: A more sophisticated confirmation modal using DaisyUI
"use client";
import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-base-100">
        <h3 className="font-bold text-lg mb-4 text-base-content">{title}</h3>
        <p className="text-base-content/80 mb-6">{message}</p>

        <div className="modal-action">
          <button onClick={onCancel} className="btn btn-ghost">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn ${isDestructive ? "btn-error" : "btn-primary"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-base-300/50" onClick={onCancel}></div>
    </div>
  );
};

export default ConfirmationModal;
