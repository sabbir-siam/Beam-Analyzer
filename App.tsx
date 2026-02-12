
import React, { useState, useEffect, useMemo, useDeferredValue, memo, useCallback } from 'react';
import { Support, Load, BeamConfig, SupportType, LoadType, AnalysisResults } from './types';
import { analyzeBeam } from './solver';
import Sidebar from './components/Sidebar';
import SchematicView from './components/SchematicView';
import ResultsDashboard from './components/ResultsDashboard';
import DetailedReport from './components/DetailedReport';

const MemoizedSchematic = memo(SchematicView);
const MemoizedResults = memo(ResultsDashboard);

const INITIAL_CONFIG: BeamConfig = {
  length: 10,
  elasticModulus: 200000, 
  momentOfInertia: 500000000 
};

const INITIAL_SUPPORTS: Support[] = [
  { id: '1', type: SupportType.PINNED, position: 0 },
  { id: '2', type: SupportType.ROLLER, position: 10 }
];

const INITIAL_LOADS: Load[] = [
  { id: 'l1', type: LoadType.UDL, magnitude: 10, position: 0, endPosition: 10 }
];

const App: React.FC = () => {
  const [config, setConfig] = useState<BeamConfig>(INITIAL_CONFIG);
  const [supports, setSupports] = useState<Support[]>(INITIAL_SUPPORTS);
  const [loads, setLoads] = useState<Load[]>(INITIAL_LOADS);
  const [pointOfInterest, setPointOfInterest] = useState<number>(5);
  const [displayRange, setDisplayRange] = useState<{start: number, end: number}>({start: 0, end: 10});
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isReportVisible, setIsReportVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('beamData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.config) setConfig(parsed.config);
        if (parsed.supports) setSupports(parsed.supports);
        if (parsed.loads) setLoads(parsed.loads);
        if (typeof parsed.poi === 'number') setPointOfInterest(parsed.poi);
      } catch (e) {
        console.error("Failed to parse stored beam data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const runAnalysis = () => {
      try {
        if (config.length < 0.01 || config.elasticModulus <= 0 || config.momentOfInertia <= 0) return;
        setIsCalculating(true);
        const res = analyzeBeam(config, supports, loads, pointOfInterest);
        setResults(res);
        setIsCalculating(false);
      } catch (err) {
        console.error("Analysis Error:", err);
        setIsCalculating(false);
      }
    };

    // 400ms debounce ensures smooth typing even for complex fractions like 2.5
    const timer = setTimeout(runAnalysis, 400); 
    return () => clearTimeout(timer);
  }, [config, supports, loads, pointOfInterest, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      const dataToSave = JSON.stringify({ config, supports, loads, poi: pointOfInterest });
      localStorage.setItem('beamData', dataToSave);
    }
  }, [config, supports, loads, pointOfInterest, isLoaded]);

  const handleReset = useCallback(() => {
    localStorage.removeItem('beamData');
    setConfig({ ...INITIAL_CONFIG });
    setSupports(INITIAL_SUPPORTS.map(s => ({ ...s })));
    setLoads(INITIAL_LOADS.map(l => ({ ...l })));
    setPointOfInterest(5);
    setDisplayRange({start: 0, end: 10});
    setResults(null);
  }, []);

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
                  <div className={`w-1.5 h-1.5 rounded-full ${isCalculating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">
                    {isCalculating ? 'Solving Matrices...' : 'FEM Engine Online'}
                  </span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
             <button 
               onClick={handleReset}
               className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center space-x-2"
             >
                <i className="fas fa-undo-alt"></i>
                <span>Reset</span>
             </button>
             <button 
               onClick={() => setIsReportVisible(true)}
               disabled={!results}
               className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
             >
                Full Report
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-12 custom-scrollbar no-print scroll-smooth">
          <section className="animate-fadeIn">
            <MemoizedSchematic 
              config={config} 
              supports={supports} 
              loads={loads} 
              results={results}
              pointOfInterest={pointOfInterest}
              setPointOfInterest={setPointOfInterest}
            />
          </section>

          <section className="animate-slideUp">
            <MemoizedResults 
              results={results} 
              config={config} 
              pointOfInterest={pointOfInterest} 
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
    </div>
  );
};

export default App;
