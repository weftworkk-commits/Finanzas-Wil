
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Wallet, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  RotateCcw,
  BarChart3,
  Calculator,
  TrendingUp,
  X,
  History,
  TrendingDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { Section, DayRecord, GastoRecord, GastoCategory } from './types';

const TabButton: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string 
}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center py-4 transition-all relative ${active ? 'text-blue-500 scale-105' : 'text-zinc-500 hover:text-zinc-400'}`}
  >
    {icon}
    <span className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    {active && <div className="absolute top-0 h-1 w-12 bg-blue-500 rounded-b-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>}
  </button>
);

const Card: React.FC<{ children: React.ReactNode, title?: string, icon?: React.ReactNode, extra?: React.ReactNode }> = ({ children, title, icon, extra }) => (
  <div className="bg-zinc-900/40 backdrop-blur-xl rounded-[2.5rem] border border-zinc-800/50 p-6 mb-4 custom-shadow">
    <div className="flex justify-between items-center mb-4">
      {title && (
        <div className="flex items-center gap-2">
          {icon && <span className="text-blue-500">{icon}</span>}
          <h3 className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">{title}</h3>
        </div>
      )}
      {extra}
    </div>
    {children}
  </div>
);

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('Cambios');
  
  const [cambioRecords, setCambioRecords] = useState<DayRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cambio_records');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [simData, setSimData] = useState({ efectivo: 0, tasaCompra: 0, tasaVenta: 0 });

  const [gastoRecords, setGastoRecords] = useState<GastoRecord[]>(() => {
    try {
      const saved = localStorage.getItem('gasto_records');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [editingGasto, setEditingGasto] = useState<GastoRecord | null>(null);
  const [newGasto, setNewGasto] = useState({ amount: '', category: GastoCategory.Alimentacion });

  useEffect(() => {
    localStorage.setItem('cambio_records', JSON.stringify(cambioRecords));
  }, [cambioRecords]);

  useEffect(() => {
    localStorage.setItem('gasto_records', JSON.stringify(gastoRecords));
  }, [gastoRecords]);

  const calculateGain = useMemo(() => {
    const { efectivo, tasaCompra, tasaVenta } = simData;
    if (efectivo <= 0 || tasaCompra <= 0 || tasaVenta <= 0) return 0;
    const capitalConComision = efectivo * 1.03;
    const resultadoFinal = capitalConComision * (tasaCompra / tasaVenta);
    return Math.max(0, Number((resultadoFinal - efectivo).toFixed(2)));
  }, [simData]);

  const totalGainWeekly = useMemo(() => {
    return cambioRecords.slice(-7).reduce((acc, curr) => acc + curr.gain, 0);
  }, [cambioRecords]);

  const totalGastoWeekly = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    return gastoRecords
      .filter(g => new Date(g.date) >= sevenDaysAgo)
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [gastoRecords]);

  const handleAddCambio = () => {
    if (calculateGain <= 0) return;
    const daysArr = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();
    const newRecord: DayRecord = {
      id: crypto.randomUUID(),
      day: daysArr[today.getDay()],
      gain: calculateGain,
      date: today.toISOString()
    };
    setCambioRecords(prev => [...prev, newRecord].slice(-14));
  };

  const handleAddGasto = () => {
    const amount = parseFloat(newGasto.amount);
    if (isNaN(amount) || amount <= 0) return;

    if (editingGasto) {
      setGastoRecords(prev => prev.map(g => g.id === editingGasto.id ? {
        ...g, amount, category: newGasto.category, description: ''
      } : g));
      setEditingGasto(null);
    } else {
      setGastoRecords(prev => [{
        id: crypto.randomUUID(), 
        date: new Date().toISOString(),
        amount, 
        category: newGasto.category, 
        description: ''
      }, ...prev]);
    }
    setNewGasto({ amount: '', category: GastoCategory.Alimentacion });
  };

  const deleteGasto = (id: string) => {
    if(window.confirm('¿Eliminar este registro?')) {
      setGastoRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleResetCambios = () => {
    if(window.confirm('¿Borrar todo el historial y simulador?')) {
      setCambioRecords([]);
      setSimData({ efectivo: 0, tasaCompra: 0, tasaVenta: 0 });
    }
  };

  const prepareChartData = useCallback((data: any[], key: string) => {
    const daysArr = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const last7 = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { 
        day: daysArr[d.getDay()], 
        dateString: d.toLocaleDateString(),
        [key]: 0 
      };
    });

    data.forEach(item => {
      const itemDate = new Date(item.date).toLocaleDateString();
      const chartDay = last7.find(d => d.dateString === itemDate);
      if (chartDay) chartDay[key] += item[key];
    });
    return last7;
  }, []);

  const finanzasChartData = useMemo(() => prepareChartData(cambioRecords, 'gain'), [cambioRecords, prepareChartData]);
  const gastosChartData = useMemo(() => prepareChartData(gastoRecords, 'amount'), [gastoRecords, prepareChartData]);

  return (
    <div className="min-h-screen pb-36 max-w-md mx-auto bg-zinc-950 text-zinc-50 font-sans selection:bg-blue-500/30">
      <header className="p-8 pt-12 flex justify-between items-start">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl font-black tracking-tighter mb-1">
            {activeSection === 'Cambios' ? 'Finanzas' : 'Pocket'}
          </h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${activeSection === 'Cambios' ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></span>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em]">
              {activeSection === 'Cambios' ? 'Monitor de Ganancias' : 'Control de Egresos'}
            </p>
          </div>
        </div>
        <div className="bg-zinc-900 w-12 h-12 rounded-2xl border border-zinc-800 flex items-center justify-center shadow-2xl transition-transform active:scale-95">
           {activeSection === 'Cambios' ? <TrendingUp size={22} className="text-blue-500" /> : <TrendingDown size={22} className="text-red-500" />}
        </div>
      </header>

      <main className="px-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeSection === 'Cambios' ? (
          <>
            <Card title="Ganancia Semanal" icon={<TrendingUp size={14}/>}>
              <div className="mb-6">
                <p className="text-4xl font-black tracking-tighter">
                  ${totalGainWeekly.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1">Acumulado 7 días</p>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={finanzasChartData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#71717a', fontWeight: 700}} />
                    <Tooltip cursor={{fill: '#27272a', radius: 8}} contentStyle={{backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #3f3f46', color: '#fff'}} itemStyle={{color: '#3b82f6', fontWeight: 800}} />
                    <Bar dataKey="gain" radius={[6, 6, 6, 6]} barSize={34}>
                      {finanzasChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.gain > 0 ? (index === 6 ? '#3b82f6' : '#27272a') : '#18181b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Simulador de Cambio" icon={<Calculator size={14}/>}>
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="bg-zinc-800/20 p-4 rounded-3xl border border-zinc-800/40">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Capital ($)</label>
                    <input type="number" placeholder="0.00" value={simData.efectivo || ''} onChange={e => setSimData(p => ({...p, efectivo: parseFloat(e.target.value) || 0}))} className="w-full bg-transparent border-none focus:ring-0 outline-none text-white text-3xl font-black tracking-tighter" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800/20 p-4 rounded-3xl border border-zinc-800/40">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Compra</label>
                      <input type="number" placeholder="0.00" value={simData.tasaCompra || ''} onChange={e => setSimData(p => ({...p, tasaCompra: parseFloat(e.target.value) || 0}))} className="w-full bg-transparent border-none focus:ring-0 outline-none text-white text-xl font-bold" />
                    </div>
                    <div className="bg-zinc-800/20 p-4 rounded-3xl border border-zinc-800/40">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Venta</label>
                      <input type="number" placeholder="0.00" value={simData.tasaVenta || ''} onChange={e => setSimData(p => ({...p, tasaVenta: parseFloat(e.target.value) || 0}))} className="w-full bg-transparent border-none focus:ring-0 outline-none text-white text-xl font-bold" />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-[2.5rem] flex items-center justify-between border bg-blue-600/5 border-blue-500/20">
                   <div>
                     <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1">Ganancia Estimada</p>
                     <p className="text-4xl font-black tracking-tighter text-white">${calculateGain.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                   </div>
                   <button onClick={handleAddCambio} disabled={calculateGain <= 0} className="bg-blue-600 text-white w-14 h-14 rounded-2xl hover:bg-blue-500 disabled:opacity-20 shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center active:scale-90">
                     <PlusCircle size={28} />
                   </button>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setSimData({efectivo: 0, tasaCompra: 0, tasaVenta: 0})} className="flex-1 h-12 rounded-2xl bg-zinc-900 text-[10px] font-bold text-zinc-400 border border-zinc-800 flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <RefreshCw size={14} /> LIMPIAR
                  </button>
                  <button onClick={handleResetCambios} className="flex-1 h-12 rounded-2xl bg-red-950/10 text-[10px] font-bold text-red-500/70 border border-red-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <RotateCcw size={14} /> RESET DATA
                  </button>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card title="Gasto Semanal" icon={<Wallet size={14}/>}>
              <div className="mb-6">
                <p className="text-4xl font-black tracking-tighter">${totalGastoWeekly.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">Total últimos 7 días</p>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gastosChartData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#71717a', fontWeight: 700}} />
                    <Tooltip cursor={{fill: '#27272a', radius: 8}} contentStyle={{backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff'}} />
                    <Bar dataKey="amount" fill="#ef4444" radius={[6, 6, 6, 6]} barSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title={editingGasto ? "Editando Gasto" : "Nuevo Gasto"} icon={editingGasto ? <Edit3 size={14}/> : <PlusCircle size={14}/>} extra={editingGasto && <button onClick={() => {setEditingGasto(null); setNewGasto({amount: '', category: GastoCategory.Alimentacion});}} className="text-zinc-500 hover:text-white transition-colors"><X size={16} /></button>}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800/20 p-4 rounded-3xl border border-zinc-800/40">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Monto ($)</label>
                    <input type="number" placeholder="0.00" value={newGasto.amount} onChange={e => setNewGasto(p => ({...p, amount: e.target.value}))} className="w-full bg-transparent border-none focus:ring-0 outline-none text-white text-xl font-black" />
                  </div>
                  <div className="bg-zinc-800/20 p-4 rounded-3xl border border-zinc-800/40">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Categoría</label>
                    <select value={newGasto.category} onChange={e => setNewGasto(p => ({...p, category: e.target.value as GastoCategory}))} className="w-full bg-transparent border-none focus:ring-0 outline-none text-white font-bold text-sm appearance-none">
                      {Object.values(GastoCategory).map(cat => <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleAddGasto} className={`w-full font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-xs uppercase tracking-[0.2em] ${editingGasto ? 'bg-blue-600 text-white' : 'bg-white text-black'}`}>
                  {editingGasto ? <Edit3 size={16} /> : <PlusCircle size={16} />}
                  {editingGasto ? "ACTUALIZAR" : "GUARDAR GASTO"}
                </button>
              </div>
            </Card>

            <div className="space-y-3 pb-10">
              <div className="flex justify-between items-center px-2 mb-2">
                <h3 className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">Historial</h3>
                <History size={14} className="text-zinc-700" />
              </div>
              {gastoRecords.map(g => (
                <div key={g.id} className="bg-zinc-900/40 rounded-[2rem] p-5 flex items-center justify-between border border-zinc-800/50 hover:bg-zinc-900/60 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:text-red-500 transition-colors">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <p className="font-black text-white text-xl tracking-tighter">${g.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{g.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingGasto(g); setNewGasto({amount: g.amount.toString(), category: g.category}); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-3 bg-zinc-800/50 rounded-xl text-zinc-400 hover:text-white transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => deleteGasto(g.id)} className="p-3 bg-zinc-800/50 rounded-xl text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {gastoRecords.length === 0 && (
                <div className="py-12 flex flex-col items-center text-zinc-700">
                  <Wallet size={24} className="opacity-20 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Sin registros</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-zinc-900/80 backdrop-blur-3xl border border-zinc-800/50 rounded-[2.5rem] flex items-center justify-around px-6 z-50 h-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <TabButton active={activeSection === 'Cambios'} onClick={() => setActiveSection('Cambios')} icon={<Calculator size={22} />} label="Cambios" />
        <div className="w-[1px] h-8 bg-zinc-800"></div>
        <TabButton active={activeSection === 'Gastos'} onClick={() => setActiveSection('Gastos')} icon={<BarChart3 size={22} />} label="Gastos" />
      </nav>
    </div>
  );
};

export default App;
