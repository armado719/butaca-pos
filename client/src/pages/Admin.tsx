import { useState } from 'react';
import {
  LayoutDashboard, UtensilsCrossed, Table2, Users,
  TrendingUp, LogOut, DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ButacaLogo } from '../components/ButacaLogo';
import { TabReportes } from './admin/TabReportes';
import { TabProductos } from './admin/TabProductos';
import { TabMesas } from './admin/TabMesas';
import { TabUsuarios } from './admin/TabUsuarios';
import { TabEgresos } from './admin/TabEgresos';
import { TabEmpleados } from './admin/TabEmpleados';
import { TabInventario } from './admin/TabInventario';

type Tab = 'reportes' | 'productos' | 'mesas' | 'usuarios' | 'egresos' | 'empleados' | 'inventario';

export const AdminUI = () => {
  const [tab, setTab] = useState<Tab>('reportes');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'reportes',   label: 'Reportes',   icon: <TrendingUp size={18} /> },
    { id: 'productos',  label: 'Productos',  icon: <UtensilsCrossed size={18} /> },
    { id: 'mesas',      label: 'Mesas',      icon: <Table2 size={18} /> },
    { id: 'usuarios',   label: 'Usuarios',   icon: <Users size={18} /> },
    { id: 'egresos',    label: 'Egresos',    icon: <DollarSign size={18} /> },
    { id: 'empleados',  label: 'Empleados',  icon: <Users size={18} /> },
    { id: 'inventario', label: 'Inventario', icon: <Table2 size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col items-center">
          <ButacaLogo size={90} theme="light" />
          <p className="text-xs text-gray-400 tracking-widest mt-1 uppercase">Panel Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-secondary text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <div className="h-40 w-full relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2000"
            className="absolute inset-0 w-full h-full object-cover scale-110"
            alt="Admin Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-darkBg/90 via-darkBg/50 to-transparent flex flex-col justify-center px-8">
            <div className="flex items-center gap-2 text-primary/80 text-xs font-black uppercase tracking-[0.3em] mb-1">
              <div className="w-8 h-0.5 bg-primary" /> La Butaca Administrativa
            </div>
            <h1 className="text-white text-3xl font-black uppercase tracking-tighter capitalize">{tab}</h1>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6 text-gray-400 text-sm">
            <LayoutDashboard size={16} />
            <span>Admin</span><span>/</span>
            <span className="text-gray-700 font-semibold capitalize">{tab}</span>
          </div>
          {tab === 'reportes'   && <TabReportes />}
          {tab === 'productos'  && <TabProductos />}
          {tab === 'mesas'      && <TabMesas />}
          {tab === 'usuarios'   && <TabUsuarios />}
          {tab === 'egresos'    && <TabEgresos />}
          {tab === 'empleados'  && <TabEmpleados />}
          {tab === 'inventario' && <TabInventario />}
        </div>
      </main>
    </div>
  );
};
