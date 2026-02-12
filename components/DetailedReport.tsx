
import React from 'react';
import { AnalysisResults, BeamConfig, Support, Load } from '../types';

interface DetailedReportProps {
  results: AnalysisResults;
  config: BeamConfig;
  supports: Support[];
  loads: Load[];
  onClose: () => void;
}

const DetailedReport: React.FC<DetailedReportProps> = ({ results, config, supports, loads, onClose }) => {
  const E_Pa = config.elasticModulus * 1e6;
  const I_m4 = config.momentOfInertia * 1e-12;
  const EI = E_Pa * I_m4;

  const handlePrint = () => {
    window.print();
  };

  const MiniGraph = ({ data, color, yLabel, type }: { data: number[], color: string, yLabel: string, type: 'step' | 'line' }) => {
    const width = 600;
    const height = 120;
    const padding = 20;
    const maxVal = Math.max(...data.map(Math.abs), 0.001);
    const scaleY = (height / 2 - padding) / maxVal;
    const scaleX = (width - 2 * padding) / (data.length - 1);

    const points = data.map((v, i) => {
      const x = padding + i * scaleX;
      const y = height / 2 - v * scaleY;
      return `${x},${y}`;
    });

    return (
      <div className="mt-4 border border-slate-200 rounded-xl p-6 bg-white shadow-sm break-inside-avoid">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{yLabel} Profile</span>
          <div className="flex gap-4">
            <span className="text-[9px] font-bold text-slate-500">Peak: {Math.max(...data).toFixed(2)}</span>
            <span className="text-[9px] font-bold text-slate-500">Min: {Math.min(...data).toFixed(2)}</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible">
          <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#e2e8f0" strokeWidth="2" />
          {type === 'line' ? (
            <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />
          ) : (
            data.map((v, i) => i < data.length - 1 ? (
              <line key={i} 
                x1={padding + i * scaleX} y1={height/2 - v * scaleY} 
                x2={padding + (1+i) * scaleX} y2={height/2 - v * scaleY} 
                stroke={color} strokeWidth="3" />
            ) : null)
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-10 animate-fadeIn printable-wrapper">
      <div className="bg-white w-full max-w-6xl h-full rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
        
        <div className="p-8 border-b border-slate-100 flex items-center justify-between no-print bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Engineering Document</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Comprehensive Structural Analysis Output</p>
          </div>
          <div className="flex items-center space-x-4">
             <button 
               onClick={handlePrint} 
               className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 transform active:scale-95"
             >
               <i className="fas fa-file-pdf"></i> Generate PDF
             </button>
             <button 
               onClick={onClose} 
               className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
             >
               Close
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 sm:p-20 space-y-20 custom-scrollbar bg-white printable-area">
          <div className="hidden print:block mb-16 border-b-8 border-slate-900 pb-10">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">BEAM ANALYZER</h1>
                <p className="text-sm font-black text-indigo-600 uppercase tracking-[0.4em]">Precision Structural Kernel v2.1</p>
              </div>
              <div className="text-right border-l-2 border-slate-100 pl-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Report Status: Verified</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Date: {new Date().toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          </div>

          <section className="space-y-10">
             <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-indigo-600 rounded-full"></div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">1. Input Configuration & Rigidity</h3>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 bg-slate-50 p-10 rounded-3xl border border-slate-100">
                <div className="space-y-2">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Span Length</span>
                   <p className="text-2xl font-black text-slate-900">{config.length} m</p>
                </div>
                <div className="space-y-2">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Elastic Modulus</span>
                   <p className="text-2xl font-black text-slate-900">{config.elasticModulus} MPa</p>
                </div>
                <div className="space-y-2">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Inertia (I)</span>
                   <p className="text-2xl font-black text-slate-900">{config.momentOfInertia} mm⁴</p>
                </div>
                <div className="space-y-2">
                   <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Calculated EI</span>
                   <p className="text-2xl font-black text-indigo-600">{(EI/1000).toFixed(2)} kN·m²</p>
                </div>
             </div>
          </section>

          <section className="space-y-10">
             <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-indigo-600 rounded-full"></div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">2. Nodal Equilibrium Results</h3>
             </div>
             <div className="overflow-hidden border border-slate-200 rounded-3xl">
               <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-8 py-6">Reaction Label</th>
                      <th className="px-8 py-6 text-right">Vertical Force (kN)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {results.reactions.map((r, i) => (
                      <tr key={i}>
                        <td className="px-8 py-5 font-black text-indigo-600 uppercase">{r.label} at {r.position}m</td>
                        <td className="px-8 py-5 text-right font-black text-slate-900">{r.force.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </section>

          <section className="space-y-12">
             <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-indigo-600 rounded-full"></div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">3. Stress & Displacement Profiles</h3>
             </div>
             <div className="grid grid-cols-1 gap-12">
                <MiniGraph data={results.shearForce} color="#2563eb" yLabel="Shear (kN)" type="step" />
                <MiniGraph data={results.bendingMoment} color="#4f46e5" yLabel="Moment (kNm)" type="line" />
             </div>
          </section>

          <footer className="pt-24 pb-10 border-t border-slate-100 text-center space-y-8 break-inside-avoid">
             <div className="flex flex-col items-center">
                <div className="bg-slate-900 text-white p-4 rounded-2xl mb-4 shadow-xl flex items-center gap-3">
                  <i className="fas fa-grip-lines text-indigo-400"></i>
                  <span className="text-sm font-black tracking-tighter uppercase">BEAM ANALYZER</span>
                </div>
                <p className="text-lg font-black text-slate-800 tracking-tight">Sabbir Ahamed Siam</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-lg">Civil, CUET</p>
             </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default DetailedReport;
