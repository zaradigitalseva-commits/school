import { type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicLayout({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation();

  // The SchoolConnect homepage renders its own complete header and footer.
  // Do not wrap it in the legacy Bright Future Academy layout.
  if (pathname === '/') {
    return <>{children ?? <Outlet />}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 pt-16">{children ?? <Outlet />}</main>
      <Footer />
    </div>
  );
}
