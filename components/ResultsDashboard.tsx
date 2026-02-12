
import React, { useState, memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts';
import { AnalysisResults, BeamConfig, ILDType, UnitSystem } from '../types';

interface ResultsDashboardProps {
  unitSystem: UnitSystem;
  results: AnalysisResults | null;
  config: BeamConfig;
  pointOfInterest: number;
  displayRange: {start: number, end: number};
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ unitSystem, results, config, pointOfInterest, displayRange }) => {
  const [activeView, setActiveView] = useState<'sfd' | 'bmd' | 'def' | 'ild'>('sfd');
  const [ildMode, setIldMode] = useState<ILDType>(ILDType.REACTION);
  const [selectedReactionId, setSelectedReactionId] = useState<string>('');

  if (!results || !results.nodes || results.nodes.length === 0) return null;

  const filteredIndices = results.nodes.reduce((acc, x, i) => {
    if (x >= displayRange.start && x <= displayRange.end) acc.push(i);
    return acc;
  }, [] as number[]);

  if (filteredIndices.length === 0) return (
    <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl flex items-center justify-center h-96">
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No data in selected display range</p>
    </div>
  );

  const chartData = filteredIndices.map(i => ({
    x: results.nodes[i].toFixed(2),
    rawX: results.nodes[i],
    shear: parseFloat(results.shearForce[i].toFixed(2)),
    moment: parseFloat(results.bendingMoment[i].toFixed(2)),
    deflection: parseFloat(results.deflection[i].toFixed(3))
  }));

  const unitLabels = unitSystem === UnitSystem.MKS 
    ? { l: 'm', f: 'kN', m: 'kNm', d: 'mm' } 
    : { l: 'ft', f: 'kip', m: 'kip-ft', d: 'in' };

  let ildData: {x: number, value: number}[] = [];

  if (ildMode === ILDType.REACTION) {
    const firstId = results.reactions[0]?.id || '';
    const currentId = selectedReactionId || firstId;
    ildData = results.ildReactions[currentId] || [];
  } else if (ildMode === ILDType.SHEAR) {
    ildData = results.ildShearAtProbe || [];
  } else if (ildMode === ILDType.MOMENT) {
    ildData = results.ildMomentAtProbe || [];
  }

  const filteredIldData = ildData.filter(p => p.x >= displayRange.start && p.x <= displayRange.end);

  const getYDomain = (dataKey: string) => {
    const vals = chartData.map(d => (d as any)[dataKey]);
    if (vals.length === 0) return [0, 1];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = Math.max(0.1, max - min);
    return [min - range * 0.15, max + range * 0.15];
  };

  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Analysis Visualization</h2>
          <p className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Continuous State Monitoring</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200 overflow-x-auto max-w-full">
          {(['sfd', 'bmd', 'def', 'ild'] as const).map(view => (
            <button key={view} onClick={() => setActiveView(view)}
              className={`px-4 sm:px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${
                activeView === view ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'
              }`}>
              {view === 'sfd' ? 'Shear' : view === 'bmd' ? 'Moment' : view === 'def' ? 'Deflection' : 'Influence'}
            </button>
          ))}
        </div>
      </div>

      {activeView === 'ild' && (
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode:</span>
            <div className="flex bg-white rounded-lg p-1 border border-slate-200">
              {([ILDType.REACTION, ILDType.SHEAR, ILDType.MOMENT] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setIldMode(mode)}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${
                    ildMode === mode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          
          {ildMode === ILDType.REACTION && results.reactions.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support:</span>
              <select 
                value={selectedReactionId || (results.reactions[0]?.id)} 
                onChange={(e) => setSelectedReactionId(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-4 py-1.5 text-[10px] font-black outline-none cursor-pointer focus:border-indigo-500"
              >
                {results.reactions.map(r => <option key={r.id} value={r.id}>{r.label} at {r.position.toFixed(2)}{unitLabels.l}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="h-[300px] sm:h-[400px] lg:h-[450px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          {activeView === 'ild' ? (
            <LineChart data={filteredIldData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="x" tick={{fontSize: 10, fontWeight: 600}} unit={unitLabels.l} />
              <YAxis tick={{fontSize: 10, fontWeight: 600}} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ fontSize: '11px', fontWeight: 'bold', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                formatter={(val: any) => [parseFloat(val).toFixed(3), "Coefficient"]}
              />
              <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="gradShear" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                <linearGradient id="gradMoment" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                <linearGradient id="gradDef" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="x" tick={{fontSize: 10, fontWeight: 600}} unit={unitLabels.l} />
              <YAxis 
                tick={{fontSize: 10, fontWeight: 600}} 
                domain={activeView === 'sfd' ? getYDomain('shear') : activeView === 'bmd' ? getYDomain('moment') : getYDomain('deflection')} 
              />
              <Tooltip 
                contentStyle={{ fontSize: '11px', fontWeight: 'bold', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                formatter={(val: any) => [parseFloat(val).toFixed(3), activeView === 'sfd' ? unitLabels.f : activeView === 'bmd' ? unitLabels.m : unitLabels.d]}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={2} />
              
              {pointOfInterest >= displayRange.start && pointOfInterest <= displayRange.end && (
                <ReferenceLine x={pointOfInterest.toFixed(2)} stroke="#8b5cf6" strokeDasharray="3 3" strokeWidth={2} label={{ position: 'top', value: 'Probe', fontSize: 9, fontWeight: 900, fill: '#6366f1' }} />
              )}

              {activeView === 'sfd' && (
                <Area type="stepAfter" dataKey="shear" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#gradShear)" dot={false} />
              )}
              {activeView === 'bmd' && (
                <Area type="monotone" dataKey="moment" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#gradMoment)" dot={false} />
              )}
              {activeView === 'def' && (
                <Area type="monotone" dataKey="deflection" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#gradDef)" dot={false} />
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
         <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Abs Shear</p>
            <p className="text-xl font-black text-blue-600 font-mono">{Math.max(Math.abs(results.maxShear), Math.abs(results.minShear)).toFixed(2)} <span className="text-[10px]">{unitLabels.f}</span></p>
         </div>
         <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Abs Moment</p>
            <p className="text-xl font-black text-indigo-600 font-mono">{Math.max(Math.abs(results.maxMoment), Math.abs(results.minMoment)).toFixed(2)} <span className="text-[10px]">{unitLabels.m}</span></p>
         </div>
         <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peak Deflection</p>
            <p className="text-xl font-black text-emerald-600 font-mono">{Math.max(Math.abs(results.maxDeflection), Math.abs(results.minDeflection)).toFixed(3)} <span className="text-[10px]">{unitLabels.d}</span></p>
         </div>
         <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Design Class</p>
            <span className="inline-block px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] font-black border border-indigo-200 uppercase">
              {results.determinacy === 0 ? 'Determinate' : `Indeterminate (${results.determinacy}°)`}
            </span>
         </div>
      </div>
    </div>
  );
};

export default memo(ResultsDashboard);
