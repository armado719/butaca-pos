import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, ShoppingCart, Send, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MeseroUI = () => {
  const [mesas, setMesas] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<any>(null);
  const [carrito, setCarrito] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [mesasRes, menuRes] = await Promise.all([
        axios.get('http://localhost:3001/api/mesas', { headers }),
        axios.get('http://localhost:3001/api/productos', { headers })
      ]);
      
      setMesas(mesasRes.data);
      setMenu(menuRes.data);
    } catch (error) {
      console.error(error);
      alert('Error cargando los datos. Inicia sesión de nuevo.');
      navigate('/');
    }
  };

  const agregarAlCarrito = (producto: any) => {
    const existe = carrito.find(p => p.id === producto.id);
    if (existe) {
      setCarrito(carrito.map(p => p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1, observaciones: '' }]);
    }
  };

  const actualizarCantidad = (id: number, delta: number) => {
    setCarrito(carrito.map(p => {
      if(p.id === id) {
        const nuevaCantidad = p.cantidad + delta;
        return nuevaCantidad > 0 ? { ...p, cantidad: nuevaCantidad } : null;
      }
      return p;
    }).filter(Boolean) as any[]);
  };

  const enviarPedido = async () => {
    if (!mesaSeleccionada) return alert('Selecciona una mesa');
    if (carrito.length === 0) return alert('El carrito está vacío');

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3001/api/pedidos', {
        mesa_id: mesaSeleccionada.id,
        productos: carrito,
        observaciones: ''
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('¡Comanda enviada a la cocina con éxito!');
      setCarrito([]);
      setMesaSeleccionada(null);
      cargarDatos(); // Recargar el estado de las mesas
    } catch (error) {
      alert('Hubo un error al enviar el pedido');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* MENÚ LATERAL - PRODUCTOS */}
      <div className="w-2/3 bg-white overflow-y-auto flex flex-col border-r border-gray-200 shadow-lg">
        {/* Header App */}
        <div className="bg-darkBg p-4 text-white flex justify-between items-center sticky top-0 z-10 shadow-md">
          <h1 className="text-2xl font-bold text-primary">La Butaca - Mesero</h1>
          <button 
            onClick={() => { localStorage.clear(); navigate('/'); }} 
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition"
          >
            <LogOut size={20} /> Salir
          </button>
        </div>

        {/* Lista del Menú Agrupado */}
        <div className="p-6">
          {menu.map((categoria: any) => (
            <div key={categoria.id} className="mb-10">
              <h2 className="text-xl font-bold text-darkBg mb-4 border-b-2 border-primary inline-block pb-1">
                {categoria.nombre}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {categoria.productos.map((prod: any) => (
                  <div 
                    key={prod.id} 
                    onClick={() => agregarAlCarrito(prod)}
                    className="bg-gray-50 hover:bg-yellow-50 border border-gray-200 rounded-xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-95 flex justify-between flex-col"
                  >
                    <h3 className="font-bold text-gray-800">{prod.nombre}</h3>
                    <p className="text-secondary font-bold mt-2">
                      ${prod.precio.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PANEL DERECHO - TOMA DE PEDIDO */}
      <div className="w-1/3 bg-gray-50 flex flex-col h-full shadow-inner">
        {/* Selector de Mesas */}
        <div className="p-4 bg-white border-b shadow-sm">
          <h3 className="font-bold text-gray-700 mb-2">Seleccionar Mesa:</h3>
          <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
            {mesas.map(mesa => (
              <button
                key={mesa.id}
                onClick={() => setMesaSeleccionada(mesa)}
                className={`min-w-16 h-12 rounded-lg font-bold flex-shrink-0 transition-all ${
                  mesaSeleccionada?.id === mesa.id 
                    ? 'bg-primary text-darkBg shadow-md ring-2 ring-primary ring-offset-2' 
                    : mesa.estado === 'ocupada' 
                      ? 'bg-red-100 text-red-600 border border-red-300 opacity-60' 
                      : 'bg-white border text-gray-600 hover:bg-gray-100'
                }`}
              >
                M-{mesa.numero}
              </button>
            ))}
          </div>
        </div>

        {/* Lista del Carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 opacity-50" />
              <p>Agrega productos al pedido</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm leading-tight">{item.nombre}</h4>
                  <p className="text-primary font-bold text-sm">${(item.precio * item.cantidad).toLocaleString()}</p>
                </div>
                
                {/* Controles de Cantidad */}
                <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
                  <button onClick={() => actualizarCantidad(item.id, -1)} className="text-secondary p-1 hover:bg-white rounded-full transition">
                     {item.cantidad === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                  </button>
                  <span className="font-bold text-gray-700 w-4 text-center">{item.cantidad}</span>
                  <button onClick={() => actualizarCantidad(item.id, 1)} className="text-primary p-1 hover:bg-white rounded-full transition">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Carrito */}
        <div className="bg-white p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-bold">Total:</span>
            <span className="text-3xl font-black text-darkBg">
              ${carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0).toLocaleString()}
            </span>
          </div>
          
          <button 
            onClick={enviarPedido}
            disabled={!mesaSeleccionada || carrito.length === 0}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg transition ${
              !mesaSeleccionada || carrito.length === 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-primary text-darkBg hover:bg-yellow-400 shadow-md hover:shadow-xl'
            }`}
          >
            <Send size={24} />
            {mesaSeleccionada ? `Enviar Comanda (Mesa ${mesaSeleccionada.numero})` : 'Selecciona una Mesa'}
          </button>
        </div>

      </div>
    </div>
  );
};
