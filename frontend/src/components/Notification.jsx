import React, { useEffect, useState } from "react";

export default function Notification({ message, type = "success", onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2200);
    const remove = setTimeout(() => onClose(), 2700);
    return () => {
      clearTimeout(timer);
      clearTimeout(remove);
    };
  }, [onClose]);

  const bgColor =
    type === "error" ? "bg-red-600" : "bg-green-600";

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5"
      } ${bgColor} z-[60]`}
    >
      {message}
    </div>
  );
}
