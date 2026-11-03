import "./admin.css";
import AdminProvider from "@/context/AdminProvider";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: { default: "پنل مدیریت", template: "%s | پنل مدیریت" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
