import { useState } from 'react';
import {
  LogOut,
  Settings as SettingsIcon,
  BarChart3,
  Wallet,
  Clock,
  Bot,
  X as XIcon,
  Menu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onSettingsClick: () => void;
  profile: any;
}

export function DashboardLayout({ children, onSettingsClick, profile }: DashboardLayoutProps) {
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: BarChart3, label: 'MI TERMINAL', href: '#', active: true },
    { icon: Wallet, label: 'BILLTERA', href: '#' },
    { icon: Clock, label: 'HISTORIAL', href: '#' },
    { icon: Bot, label: 'ASISTENTE AI', href: '#' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <XIcon size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-900/80 border-r border-slate-800 backdrop-blur-sm transition-transform duration-300 z-40 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">Ac</span>
            </div>
            <span className="text-xl font-bold">Acripton</span>
          </div>
        </div>

        {/* Main Button */}
        <div className="p-6">
          <button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-3 px-4 font-bold flex items-center gap-2 transition-colors">
            <BarChart3 size={20} />
            MI TERMINAL
          </button>
        </div>

        {/* Menu Items */}
        <nav className="px-3 space-y-2">
          {menuItems.slice(1).map((item, idx) => {
            const Icon = item.icon;
            return (
              <a
                key={idx}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors uppercase text-sm font-semibold"
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Bottom Section */}
        <div className="p-6 border-t border-slate-800 space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">DB LOCAL SEGURA</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm font-medium">CONECTADO</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">TERMINAL DE</p>
            <p className="text-2xl font-bold mb-4">{profile?.email?.charAt(0).toUpperCase() || 'U'}</p>
          </div>

          <button
            onClick={() => {
              signOut();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-colors uppercase text-sm font-semibold"
          >
            <LogOut size={16} />
            CERRAR SESIÓN
          </button>

          <button
            onClick={() => {
              onSettingsClick();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors uppercase text-sm font-semibold"
          >
            <SettingsIcon size={16} />
            AJUSTES
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0">
        {children}
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}
