import "./globals.css";
import Sidebar from "../components/Sidebar";

export const metadata = {
  title: "English Coach MVP",
  description: "Local English speaking learning admin system"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
