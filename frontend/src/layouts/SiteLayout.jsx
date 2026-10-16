import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SiteLayout() {
  return <div className="site-shell"><Navbar /><main className="site-main"><Outlet /></main><Footer /></div>;
}
