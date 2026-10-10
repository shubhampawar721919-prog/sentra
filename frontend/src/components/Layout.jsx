import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const layoutStyle = {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#F6FAFD',
  };

  const sidebarStyle = {
    width: '260px',
    flexShrink: 0,
  };

  const mainContentStyle = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  };

  const pageContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 32px',
  };

  return (
    <div style={layoutStyle}>
      <div style={sidebarStyle}>
        <Sidebar />
      </div>
      <div style={mainContentStyle}>
        <Navbar />
        <main style={pageContainerStyle}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
