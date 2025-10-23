import Sidebar from "./components/Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-grow bg-gray-50 p-6">{children}</main>
    </div>
  );
}
