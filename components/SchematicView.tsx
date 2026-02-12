
import React from 'react';
import { BeamConfig, Support, Load, SupportType, LoadType, AnalysisResults } from '../types';

interface SchematicViewProps {
  config: BeamConfig;
  supports: Support[];
  loads: Load[];
  results: AnalysisResults | null;
  pointOfInterest: number;
  setPointOfInterest: (x: number) => void;
  onReset: () => void;
}

const SchematicView: React.FC<SchematicViewProps> = ({ config, supports, loads, results, pointOfInterest, setPointOfInterest, onReset }) => {
  const width = 800;
  const height = 280;
  const margin = 80;
  const beamY = 160;
  const scaleX = (width - 2 * margin) / (config.length || 1);

  const toX = (x: number) => margin + x * scaleX;

  // Global scale for distributed loads to prevent vertical overflow
  const distributedLoads = loads.filter(l => l.type === LoadType.UDL || l.type === LoadType.UVL);
  const maxDistLoadMagnitude = distributedLoads.reduce((max, l) => {
    const m1 = Math.abs(l.magnitude);
    const m2 = Math.abs(l.endMagnitude ?? 0);
    return Math.max(max, m1, m2);
  }, 1); // Baseline of 1 to avoid division by zero

  const MAX_VISUAL_LOAD_HEIGHT = 80; // Maximum visual height in pixels for the largest distributed load

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 relative">
      {/* Interactive Controls Header */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Interactive Schematic</h3>
          <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Probe</span>
            <input 
              type="range" 
              min="0" 
              max={config.length} 
              step="0.01" 
              value={pointOfInterest} 
              onChange={(e) => setPointOfInterest(parseFloat(e.target.value))}
              className="w-24 sm:w-48 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-slate-900 px-5 py-2 rounded-xl border border-slate-800 flex items-center space-x-3 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
            <span className="text-xl font-black text-white font-mono">{pointOfInterest.toFixed(2)}<span className="text-[10px] text-slate-500 ml-1 uppercase">m</span></span>
          </div>
          <button 
            onClick={onReset}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all active:scale-95 shadow-lg shadow-red-100/50"
          >
            <i className="fas fa-undo-alt text-xs"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Reset</span>
          </button>
        </div>
      </div>

      <div className="w-full">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker id="arrowhead-red-large" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orientation="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
            </marker>
          </defs>

          {/* Dimension Line with Ticks (No horizontal arrows) */}
          <g transform={`translate(0, ${beamY + 60})`}>
            <line x1={margin} y1="0" x2={width - margin} y2="0" stroke="#cbd5e1" strokeWidth="2" />
            {/* Start Tick */}
            <line x1={margin} y1="-8" x2={margin} y2="8" stroke="#94a3b8" strokeWidth="2" />
            <text x={margin} y="22" textAnchor="middle" className="text-[10px] font-black fill-slate-400">0 m</text>
            {/* End Tick */}
            <line x1={width - margin} y1="-8" x2={width - margin} y2="8" stroke="#94a3b8" strokeWidth="2" />
            <text x={width - margin} y="22" textAnchor="middle" className="text-[10px] font-black fill-slate-400">{config.length.toFixed(2)} m</text>
          </g>

          {/* Beam Body */}
          <line x1={margin} y1={beamY} x2={width - margin} y2={beamY} stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />

          {/* Supports */}
          {supports.map((s) => {
            const x = toX(s.position);
            if (s.type === SupportType.PINNED) {
              return (
                <g key={s.id} transform={`translate(${x}, ${beamY + 4})`}>
                  <polygon points="0,0 -14,24 14,24" fill="#f97316" />
                  <line x1="-18" y1="24" x2="18" y2="24" stroke="#1e293b" strokeWidth="3" />
                </g>
              );
            }
            if (s.type === SupportType.ROLLER) {
              return (
                <g key={s.id} transform={`translate(${x}, ${beamY + 4})`}>
                  <circle cx="0" cy="18" r="9" fill="none" stroke="#f97316" strokeWidth="3" />
                  <line x1="-14" y1="28" x2="14" y2="28" stroke="#1e293b" strokeWidth="3" />
                </g>
              );
            }
            if (s.type === SupportType.FIXED) {
               const isLeft = s.position <= config.length / 2;
               return (
                 <g key={s.id} transform={`translate(${x}, ${beamY - 40})`}>
                   <rect x={isLeft ? -12 : 0} y="0" width="12" height="80" fill="#0f172a" />
                   {Array.from({length: 8}).map((_, j) => (
                     <line key={j} x1={isLeft ? -12 : 12} y1={j * 10 + 5} x2={isLeft ? -22 : 22} y2={j * 10} stroke="#475569" strokeWidth="2" />
                   ))}
                 </g>
               );
            }
            if (s.type === SupportType.HINGE) {
              return (
                <circle key={s.id} cx={x} cy={beamY} r="6" fill="white" stroke="#334155" strokeWidth="3" />
              );
            }
            return null;
          })}

          {/* Loads */}
          {loads.map((l) => {
            const x = toX(l.position);
            if (l.type === LoadType.POINT) {
              return (
                <g key={l.id} transform={`translate(${x}, ${beamY - 80})`}>
                  <line x1="0" y1="0" x2="0" y2="72" stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrowhead-red-large)" />
                  <text x="0" y="-12" textAnchor="middle" className="text-[12px] font-black fill-red-700">{l.magnitude} kN</text>
                </g>
              );
            }
            if (l.type === LoadType.UDL || l.type === LoadType.UVL) {
               const xEnd = toX(l.endPosition || config.length);
               const udlWidth = Math.max(0, xEnd - x);
               
               // Vertical height is scaled relative to the maximum distributed load found
               const hStart = (Math.abs(l.magnitude) / maxDistLoadMagnitude) * MAX_VISUAL_LOAD_HEIGHT;
               const hEnd = l.type === LoadType.UVL 
                  ? (Math.abs(l.endMagnitude ?? 0) / maxDistLoadMagnitude) * MAX_VISUAL_LOAD_HEIGHT 
                  : hStart;
               
               return (
                 <g key={l.id} transform={`translate(${x}, ${beamY - 4})`}>
                   <path d={`M 0,${-hStart} L ${udlWidth},${-hEnd}`} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
                   <rect x="0" y={-Math.max(hStart, hEnd)} width={udlWidth} height={Math.max(hStart, hEnd)} fill="rgba(239, 68, 68, 0.08)" />
                   
                   {/* Vertical lines */}
                   {Array.from({length: Math.max(2, Math.floor(udlWidth / 30))}).map((_, j) => {
                      const ratio = j / (Math.max(2, Math.floor(udlWidth / 30)) - 1);
                      const lx = ratio * udlWidth;
                      const h = hStart + (hEnd - hStart) * ratio;
                      return <line key={j} x1={lx} y1={-h} x2={lx} y2="-2" stroke="#ef4444" strokeWidth="1.5" />;
                   })}
                   
                   <text x={udlWidth/2} y={-Math.max(hStart, hEnd) - 10} textAnchor="middle" className="text-[11px] font-black fill-red-700">
                      {l.type === LoadType.UVL ? `${l.magnitude} → ${l.endMagnitude} kN/m` : `${l.magnitude} kN/m`}
                   </text>
                 </g>
               );
            }
            if (l.type === LoadType.MOMENT) {
               return (
                 <g key={l.id} transform={`translate(${x}, ${beamY})`}>
                   <path d="M -30 -30 A 35 35 0 1 1 30 -30" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                   <text x="0" y="-50" textAnchor="middle" className="text-[12px] font-black fill-indigo-700">{l.magnitude} kNm</text>
                 </g>
               )
            }
            return null;
          })}

          {/* Interactive Probe Marker */}
          <g transform={`translate(${toX(pointOfInterest)}, ${beamY})`}>
             <line x1="0" y1="-120" x2="0" y2="120" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3" />
             <circle cx="0" cy="0" r="7" fill="white" stroke="#3b82f6" strokeWidth="3" />
             <circle cx="0" cy="0" r="3" fill="#3b82f6" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default SchematicView;
