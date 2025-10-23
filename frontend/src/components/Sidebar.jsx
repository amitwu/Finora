// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, FolderKanban, FileEdit, BarChart3, Upload, Link2 } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const links = [
    { name: "לוח מחוונים", path: "/dashboard", icon: <Home /> },
    { name: "הזנה ידנית", path: "/manual-entry", icon: <FileEdit /> },
    { name: "קטגוריות", path: "/categories", icon: <FolderKanban /> },
    { name: "דו\"ח חודשי", path: "/monthly-report", icon: <BarChart3 /> },
    { name: "העלאת תדפיסים", path: "/upload", icon: <Upload /> },
    { name: "מיפוי בתי עסק", path: "/mapping", icon: <Link2 /> },
  ];

  return (
    <aside className="w-56 bg-purple-50 h-full shadow-lg p-4 flex flex-col gap-4">
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
            location.pathname === link.path
              ? "bg-purple-600 text-white"
              : "text-gray-700 hover:bg-purple-100"
          }`}
        >
          {link.icon}
          <span>{link.name}</span>
        </Link>
      ))}
    </aside>
  );
}
