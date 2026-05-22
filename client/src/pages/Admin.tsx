import { useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Table2,
  Users,
  TrendingUp,
  LogOut,
  DollarSign,
  Bike,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ButacaLogo } from "../components/ButacaLogo";
import { TabReportes } from "./admin/TabReportes";
import { TabProductos } from "./admin/TabProductos";
import { TabMesas } from "./admin/TabMesas";
import { TabUsuarios } from "./admin/TabUsuarios";
import { TabEgresos } from "./admin/TabEgresos";
import { TabEmpleados } from "./admin/TabEmpleados";
import { TabInventario } from "./admin/TabInventario";
import { TabDomicilios } from "./admin/TabDomicilios";

type Tab =
  | "reportes"
  | "productos"
  | "mesas"
  | "usuarios"
  | "egresos"
  | "empleados"
  | "inventario"
  | "domicilios";

export const AdminUI = () => {
  const [tab, setTab] = useState<Tab>("reportes");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "reportes", label: "Reportes", icon: <TrendingUp size={18} /> },
    {
      id: "productos",
      label: "Productos",
      icon: <UtensilsCrossed size={18} />,
    },
    { id: "mesas", label: "Mesas", icon: <Table2 size={18} /> },
    { id: "domicilios", label: "Domicilios", icon: <Bike size={18} /> },
    { id: "usuarios", label: "Usuarios", icon: <Users size={18} /> },
    { id: "egresos", label: "Egresos", icon: <DollarSign size={18} /> },
    { id: "empleados", label: "Empleados", icon: <Users size={18} /> },
    { id: "inventario", label: "Inventario", icon: <Table2 size={18} /> },
  ];

  const handleTabChange = (id: Tab) => {
    setTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-56 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-4 border-b border-gray-100 flex flex-col items-center relative">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-3 right-3 md:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
          <ButacaLogo size={90} theme="light" />
          <p className="text-xs text-gray-400 tracking-widest mt-1 uppercase">
            Panel Admin
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-secondary text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Banner */}
        <div className="h-28 md:h-40 w-full relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2000"
            className="absolute inset-0 w-full h-full object-cover scale-110"
            alt="Admin Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-darkBg/90 via-darkBg/50 to-transparent flex flex-col justify-center px-4 md:px-8">
            {/* Hamburguesa - solo móvil */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-primary/80 text-xs font-black uppercase tracking-[0.3em] mb-1 mt-8 md:mt-0">
              <div className="w-8 h-0.5 bg-primary" /> La Butaca Administrativa
            </div>
            <h1 className="text-white text-2xl md:text-3xl font-black uppercase tracking-tighter capitalize">
              {tab}
            </h1>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 md:mb-6 text-gray-400 text-sm">
            <LayoutDashboard size={16} />
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-700 font-semibold capitalize">
              {tab}
            </span>
          </div>
          {tab === "reportes" && <TabReportes />}
          {tab === "productos" && <TabProductos />}
          {tab === "mesas" && <TabMesas />}
          {tab === "usuarios" && <TabUsuarios />}
          {tab === "egresos" && <TabEgresos />}
          {tab === "empleados" && <TabEmpleados />}
          {tab === "inventario" && <TabInventario />}
          {tab === "domicilios" && <TabDomicilios />}
        </div>
      </main>
    </div>
  );
};
