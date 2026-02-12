
import React, { useState } from 'react';
import { BeamConfig, Support, Load, SupportType, LoadType } from '../types';

interface SidebarProps {
  config: BeamConfig;
  setConfig: (c: BeamConfig) => void;
  supports: Support[];
  setSupports: React.Dispatch<React.SetStateAction<Support[]>>;
  loads: Load[];
  setLoads: React.Dispatch<React.SetStateAction<Load[]>>;
  pointOfInterest: number;
  setPointOfInterest: (x: number) => void;
  displayRange: {start: number, end: number};
  setDisplayRange: (range: {start: number, end: number}) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  config, setConfig, supports, setSupports, loads, setLoads, 
  pointOfInterest, setPointOfInterest, displayRange, setDisplayRange 
}) => {
  const [activeTab, setActiveTab] = useState<'beam' | 'supports' | 'loads'>('beam');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateSupport = (id: string, updates: Partial<Support>) => {
    setSupports(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateLoad = (id: string, updates: Partial<Load>) => {
    setLoads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-slate-900 flex flex-col items-center pt-8 transition-all duration-300 shadow-2xl border-r border-slate-800">
        <button onClick={() => setIsCollapsed(false)} className="text-white hover:text-indigo-400 p-2 transition-transform hover:scale-110">
          <i className="fas fa-chevron-right text-lg"></i>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-80 transition-all duration-300 relative shadow-2xl border-r border-slate-800">
      <button 
        onClick={() => setIsCollapsed(true)} 
        className="absolute -right-3 top-24 bg-indigo-600 text-white w-6 h-12 rounded-r-md flex items-center justify-center hover:bg-indigo-700 transition-all z-30 shadow-lg"
      >
        <i className="fas fa-chevron-left text-xs"></i>
      </button>

      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center">
          <i className="fas fa-sliders-h mr-3 text-indigo-400"></i> Editor
        </h2>
      </div>

      <div className="flex border-b border-slate-800 bg-slate-800/50">
        {(['beam', 'supports', 'loads'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {activeTab === 'beam' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
              <label className="block text-[10px] font-black text-indigo-300 uppercase mb-4 tracking-widest">Beam Geometry</label>
              <div className="space-y-4">
                <div>
                  <span className="block text-[11px] font-black text-slate-100 uppercase mb-2 tracking-wide">Span Length (m)</span>
                  <input type="number" step="0.1" value={config.length} onChange={(e) => setConfig({ ...config, length: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-indigo-500 outline-none text-sm font-bold shadow-sm" />
                </div>
                <div>
                  <span className="block text-[11px] font-black text-slate-100 uppercase mb-2 tracking-wide">Elasticity E (MPa)</span>
                  <input type="number" value={config.elasticModulus} onChange={(e) => setConfig({ ...config, elasticModulus: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-indigo-500 outline-none text-sm font-bold shadow-sm" />
                </div>
                <div>
                  <span className="block text-[11px] font-black text-slate-100 uppercase mb-2 tracking-wide">Inertia I (mm⁴)</span>
                  <input type="number" value={config.momentOfInertia} onChange={(e) => setConfig({ ...config, momentOfInertia: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-indigo-500 outline-none text-sm font-bold shadow-sm" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
               <label className="block text-[10px] font-black text-indigo-300 uppercase mb-4 tracking-widest">Visualization Slice (m)</label>
               <div className="flex space-x-3">
                  <div className="flex-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Start</span>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={displayRange.start} 
                      onChange={(e) => setDisplayRange({ ...displayRange, start: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 outline-none text-xs font-bold" 
                    />
                  </div>
                  <div className="flex-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">End</span>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={displayRange.end} 
                      onChange={(e) => setDisplayRange({ ...displayRange, end: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 outline-none text-xs font-bold" 
                    />
                  </div>
               </div>
            </div>

            <div className="bg-indigo-900/10 p-5 rounded-2xl border border-indigo-900/30">
               <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Real-time Probe</label>
               <div className="relative">
                 <input 
                   type="number" 
                   step="0.01" 
                   value={pointOfInterest} 
                   onChange={(e) => setPointOfInterest(Math.min(config.length, Math.max(0, parseFloat(e.target.value) || 0)))}
                   className="w-full bg-slate-900 border border-indigo-800/40 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none text-sm font-bold pr-10" 
                 />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase">m</span>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'supports' && (
          <div className="space-y-4 animate-fadeIn">
            <button onClick={() => setSupports(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type: SupportType.PINNED, position: config.length / 2 }])} 
              className="w-full py-3 bg-white/5 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95 shadow-md">
              Add Support
            </button>
            {supports.map(s => (
              <div key={s.id} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 relative group transition-all hover:bg-slate-800/60 shadow-sm">
                <button onClick={() => setSupports(prev => prev.filter(x => x.id !== s.id))} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors p-1">
                  <i className="fas fa-trash-alt text-[10px]"></i>
                </button>
                
                <div className="relative mb-4 mt-2">
                  <i className="fas fa-chevron-down absolute left-0 top-1/2 -translate-y-1/2 text-[10px] text-indigo-400 pointer-events-none"></i>
                  <select value={s.type} onChange={(e) => updateSupport(s.id, { type: e.target.value as SupportType })}
                    className="bg-transparent pl-6 text-[11px] font-black text-white outline-none w-full cursor-pointer uppercase tracking-[0.1em] appearance-none">
                    <option value={SupportType.PINNED} className="bg-slate-900">Pinned Support</option>
                    <option value={SupportType.ROLLER} className="bg-slate-900">Roller Support</option>
                    <option value={SupportType.FIXED} className="bg-slate-900">Fixed End</option>
                    <option value={SupportType.HINGE} className="bg-slate-900">Internal Hinge</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location:</span>
                  <input type="number" step="0.1" value={s.position} onChange={(e) => updateSupport(s.id, { position: parseFloat(e.target.value) || 0 })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-indigo-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'loads' && (
          <div className="space-y-4 animate-fadeIn">
            <button onClick={() => setLoads(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type: LoadType.POINT, magnitude: 10, position: config.length / 2 }])} 
              className="w-full py-3 bg-emerald-600/10 text-emerald-400 border border-emerald-600/30 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600/20 transition-all active:scale-95 shadow-md">
              Add Load
            </button>
            {loads.map(l => (
              <div key={l.id} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 relative hover:bg-slate-800/60 transition-all shadow-sm">
                <button onClick={() => setLoads(prev => prev.filter(x => x.id !== l.id))} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 p-1 transition-colors">
                  <i className="fas fa-trash-alt text-[10px]"></i>
                </button>
                
                <div className="relative mb-4 mt-2">
                  <i className="fas fa-chevron-down absolute left-0 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 pointer-events-none"></i>
                  <select value={l.type} onChange={(e) => updateLoad(l.id, { type: e.target.value as LoadType })}
                    className="bg-transparent pl-6 text-[11px] font-black text-white outline-none w-full cursor-pointer uppercase tracking-[0.1em] appearance-none">
                    <option value={LoadType.POINT} className="bg-slate-900">Point Load</option>
                    <option value={LoadType.UDL} className="bg-slate-900">Uniform Load (UDL)</option>
                    <option value={LoadType.UVL} className="bg-slate-900">Varying Load (UVL)</option>
                    <option value={LoadType.MOMENT} className="bg-slate-900">Concentrated Moment</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                   <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">{l.type === LoadType.UVL ? 'W1 (kN/m)' : 'Value'}:</span>
                      <input type="number" step="0.1" value={l.magnitude} onChange={(e) => updateLoad(l.id, { magnitude: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-emerald-500 transition-colors" />
                   </div>
                   {l.type === LoadType.UVL && (
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">W2 (kN/m):</span>
                      <input type="number" step="0.1" value={l.endMagnitude} onChange={(e) => updateLoad(l.id, { endMagnitude: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-emerald-500 transition-colors" />
                    </div>
                   )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Start X (m):</span>
                      <input type="number" step="0.1" value={l.position} onChange={(e) => updateLoad(l.id, { position: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-emerald-500 transition-colors" />
                   </div>
                   {(l.type === LoadType.UDL || l.type === LoadType.UVL) && (
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">End X (m):</span>
                      <input type="number" step="0.1" value={l.endPosition} onChange={(e) => updateLoad(l.id, { endPosition: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-emerald-500 transition-colors" />
                    </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-950 border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.3em] mb-3">Developed by</p>
        <div className="bg-slate-900 py-3 px-5 rounded-2xl border border-slate-800 shadow-xl transition-transform hover:scale-105 active:scale-95">
          <p className="text-sm text-indigo-400 font-black tracking-tight">Sabbir Ahamed Siam</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] mt-0.5">Civil, CUET</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
