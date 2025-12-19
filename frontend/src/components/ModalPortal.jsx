import React from "react";
import ReactDOM from "react-dom";

export default function ModalPortal({ children }) {
  const root = document.getElementById("modal-root");
  
  if (!root) return null;

  return ReactDOM.createPortal(
    <div
      className="
        fixed inset-0 
        bg-black/50 backdrop-blur-md 
        flex items-center justify-center
        z-[999999]
      "
    >
      {children}
    </div>,
    root
  );
}
