
import React, { useState, useEffect } from 'react';
import { BeamConfig, Support, Load, SupportType, LoadType, UnitSystem } from '../types';

interface SidebarProps {
  unitSystem: UnitSystem;
  setUnitSystem: (sys: UnitSystem) => void;
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

const DebouncedInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  className?: string;
  step?: string;
  label?: string;
  unit?: string;
}> = ({ value, onChange, className, step = "0.1", label, unit }) => {
  const [localValue, setLocalValue] = useState<string>(value.toString());

  useEffect(() => {
    const valParsed = parseFloat(localValue);
    if (!isNaN(valParsed) && Math.abs(valParsed - value) > 1e-6) {
      setLocalValue(value.toFixed(3).replace(/\.?0+$/, ''));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setLocalValue(valStr);
    if (valStr !== "" && !valStr.endsWith(".") && !isNaN(parseFloat(valStr))) {
      const parsed = parseFloat(valStr);
      if (Math.abs(parsed - value) > 1e-9) {
        onChange(parsed);
      }
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed)) {
      if (Math.abs(parsed - value) > 1e-9) onChange(parsed);
      setLocalValue(parsed.toFixed(3).replace(/\.?0+$/, ''));
    } else {
      setLocalValue(value.toFixed(3).replace(/\.?0+$/, ''));
    }
  };

  return (
    <div className="relative">
      {label && <span className="block text-[11px] font-black text-slate-100 uppercase mb-2 tracking-wide">{label}</span>}
      <input 
        type="text" 
        inputMode="decimal"
        value={localValue} 
        onChange={handleChange}
        onBlur={handleBlur}
        className={className} 
      />
      {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase">{unit}</span>}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  unitSystem, setUnitSystem, config, setConfig, supports, setSupports, loads, setLoads, 
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

  const unitMap = {
    [UnitSystem.MKS]: { l: 'm', e: 'MPa', i: 'mm⁴', f: 'kN', m: 'kNm', w: 'kN/m' },
    [UnitSystem.FPS]: { l: 'ft', e: 'ksi', i: 'in⁴', f: 'kip', m: 'kip-ft', w: 'kip/ft' }
  };

  const currentUnits = unitMap[unitSystem];

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
               <label className="block text-[10px] font-black text-indigo-300 uppercase mb-4 tracking-widest">Unit System</label>
               <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700">
                  <button 
                    onClick={() => setUnitSystem(UnitSystem.MKS)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${unitSystem === UnitSystem.MKS ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                  >
                    MKS (Metric)
                  </button>
                  <button 
                    onClick={() => setUnitSystem(UnitSystem.FPS)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${unitSystem === UnitSystem.FPS ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                  >
                    FPS (Imperial)
                  </button>
               </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
              <label className="block text-[10px] font-black text-indigo-300 uppercase mb-4 tracking-widest">Beam Geometry</label>
              <div className="space-y-4">
                <DebouncedInput 
                  label={`Span Length (${currentUnits.l})`}
                  value={config.length} 
                  onChange={(val) => setConfig({ ...config, length: val })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-indigo-500 outline-none text-sm font-bold shadow-sm"
                />
                <DebouncedInput 
                  label={`Elasticity E (${currentUnits.e})`}
                  value={config.elasticModulus} 
                  onChange={(val) => setConfig({ ...config, elasticModulus: val })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-indigo-500 outline-none text-sm font-bold shadow-sm"
                />
                <DebouncedInput 
                  label={`Inertia I (${currentUnits.i})`}
                  value={config.momentOfInertia} 
                  onChange={(val) => setConfig({ ...config, momentOfInertia: val })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-indigo-500 outline-none text-sm font-bold shadow-sm"
                />
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
               <label className="block text-[10px] font-black text-indigo-300 uppercase mb-4 tracking-widest">{`Visualization Slice (${currentUnits.l})`}</label>
               <div className="flex space-x-3">
                  <div className="flex-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Start</span>
                    <DebouncedInput 
                      value={displayRange.start} 
                      onChange={(val) => setDisplayRange({ ...displayRange, start: val })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 outline-none text-xs font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">End</span>
                    <DebouncedInput 
                      value={displayRange.end} 
                      onChange={(val) => setDisplayRange({ ...displayRange, end: val })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 outline-none text-xs font-bold"
                    />
                  </div>
               </div>
            </div>

            <div className="bg-indigo-900/10 p-5 rounded-2xl border border-indigo-900/30">
               <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Real-time Probe</label>
               <DebouncedInput 
                  value={pointOfInterest} 
                  onChange={(val) => setPointOfInterest(val)}
                  className="w-full bg-slate-900 border border-indigo-800/40 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none text-sm font-bold pr-10"
                  unit={currentUnits.l}
                />
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
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{`Loc (${currentUnits.l}):`}</span>
                  <DebouncedInput 
                    value={s.position} 
                    onChange={(val) => updateSupport(s.id, { position: val })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-indigo-500 transition-colors"
                  />
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
                      <span className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">
                        {l.type === LoadType.UVL ? `W1 (${currentUnits.w})` : l.type === LoadType.MOMENT ? `Val (${currentUnits.m})` : `Val (${currentUnits.f})`}:
                      </span>
                      <DebouncedInput 
                        value={l.magnitude} 
                        onChange={(val) => updateLoad(l.id, { magnitude: val })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-emerald-500 transition-colors"
                      />
                   </div>
                   {l.type === LoadType.UVL && (
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">{`W2 (${currentUnits.w}):`}</span>
                      <DebouncedInput 
                        value={l.endMagnitude ?? 0} 
                        onChange={(val) => updateLoad(l.id, { endMagnitude: val })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-emerald-500 transition-colors"
                      />
                    </div>
                   )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">{`Start X (${currentUnits.l}):`}</span>
                      <DebouncedInput 
                        value={l.position} 
                        onChange={(val) => updateLoad(l.id, { position: val })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-emerald-500 transition-colors"
                      />
                   </div>
                   {(l.type === LoadType.UDL || l.type === LoadType.UVL) && (
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">{`End X (${currentUnits.l}):`}</span>
                      <DebouncedInput 
                        value={l.endPosition ?? 0} 
                        onChange={(val) => updateLoad(l.id, { endPosition: val })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-emerald-500 transition-colors"
                      />
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
