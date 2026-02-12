
import React, { useState, useEffect, useMemo, useDeferredValue, memo } from 'react';
import { Support, Load, BeamConfig, SupportType, LoadType, AnalysisResults } from './types';
import { analyzeBeam } from './solver';
import Sidebar from './components/Sidebar';
import SchematicView from './components/SchematicView';
import ResultsDashboard from './components/ResultsDashboard';
import DetailedReport from './components/DetailedReport';

const MemoizedSchematic = memo(SchematicView);
const MemoizedResults = memo(ResultsDashboard);

const App: React.FC = () => {
  const initialConfig: BeamConfig = {
    length: 10,
    elasticModulus: 200000, 
    momentOfInertia: 500000000 
  };

  const initialSupports: Support[] = [
    { id: '1', type: SupportType.PINNED, position: 0 },
    { id: '2', type: SupportType.ROLLER, position: 10 }
  ];

  const initialLoads: Load[] = [
    { id: 'l1', type: LoadType.UDL, magnitude: 10, position: 0, endPosition: 10 }
  ];

  const [config, setConfig] = useState<BeamConfig>(initialConfig);
  const [supports, setSupports] = useState<Support[]>(initialSupports);
  const [loads, setLoads] = useState<Load[]>(initialLoads);
  const [pointOfInterest, setPointOfInterest] = useState<number>(5);
  const [displayRange, setDisplayRange] = useState<{start: number, end: number}>({start: 0, end: 10});
  const [isReportVisible, setIsReportVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Persistence: Load data from LocalStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('beamData');
    if (savedData) {
      try {
        const { config, supports, loads, poi } = JSON.parse(savedData);
        setConfig(config);
        setSupports(supports);
        setLoads(loads);
        setPointOfInterest(poi);
      } catch (e) {
        console.error("Failed to parse stored beam data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Persistence: Save data to LocalStorage on change
  useEffect(() => {
    if (isLoaded) {
      const dataToSave = JSON.stringify({ config, supports, loads, poi: pointOfInterest });
      localStorage.setItem('beamData', dataToSave);
    }
  }, [config, supports, loads, pointOfInterest, isLoaded]);

  const deferredConfig = useDeferredValue(config);
  const deferredSupports = useDeferredValue(supports);
  const deferredLoads = useDeferredValue(loads);
  const deferredPOI = useDeferredValue(pointOfInterest);

  const results = useMemo(() => {
    try {
      return analyzeBeam(deferredConfig, deferredSupports, deferredLoads, deferredPOI);
    } catch (err) {
      console.error("Analysis Error:", err);
      return null;
    }
  }, [deferredConfig, deferredSupports, deferredLoads, deferredPOI]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all configurations?")) {
      setConfig(initialConfig);
      setSupports(initialSupports);
      setLoads(initialLoads);
      setPointOfInterest(5);
      setDisplayRange({start: 0, end: 10});
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="h-full flex-shrink-0 z-20 no-print">
        <Sidebar 
          config={config} 
          setConfig={setConfig}
          supports={supports}
          setSupports={setSupports}
          loads={loads}
          setLoads={setLoads}
          pointOfInterest={pointOfInterest}
          setPointOfInterest={setPointOfInterest}
          displayRange={displayRange}
          setDisplayRange={setDisplayRange}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-10 flex items-center justify-between shadow-sm z-10 no-print">
          <div className="flex items-center space-x-4">
            <div className="bg-slate-900 p-2.5 rounded-xl text-indigo-400 flex items-center justify-center">
              <i className="fas fa-grip-lines text-xl"></i>
            </div>
            <div>
               <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                BEAM<span className="text-indigo-600">ANALYZER</span>
               </h1>
               <div className="flex items-center space-x-2 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">FEM Engine Online</span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
             <div className="hidden md:block text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">System Status</p>
                <p className={`text-xs font-bold ${results?.isStable ? 'text-emerald-600' : 'text-red-500'}`}>
                  {results?.isStable ? 'Equilibrium Active' : 'Instability Detected'}
                </p>
             </div>
             <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
             <button 
               onClick={() => setIsReportVisible(true)}
               className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95"
             >
                Full Report
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-12 custom-scrollbar no-print scroll-smooth">
          <section className="animate-fadeIn">
            <MemoizedSchematic 
              config={deferredConfig} 
              supports={deferredSupports} 
              loads={deferredLoads} 
              results={results}
              pointOfInterest={pointOfInterest}
              setPointOfInterest={setPointOfInterest}
              onReset={handleReset}
            />
          </section>

          <section className="animate-slideUp">
            <MemoizedResults 
              results={results} 
              config={deferredConfig} 
              pointOfInterest={deferredPOI} 
              displayRange={displayRange}
            />
          </section>

          <footer className="pt-20 pb-12 text-center border-t border-slate-200">
             <div className="inline-flex items-center space-x-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structural Intelligence Dashboard</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span className="text-xs font-black text-slate-800">Sabbir Ahamed Siam</span>
             </div>
          </footer>
        </main>

        {isReportVisible && results && (
          <DetailedReport 
            results={results} 
            config={config} 
            supports={supports} 
            loads={loads} 
            onClose={() => setIsReportVisible(false)} 
          />
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-slideUp { animation: slideUp 0.6s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
