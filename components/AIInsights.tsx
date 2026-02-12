
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BeamConfig, Support, Load, AnalysisResults } from '../types';

interface AIInsightsProps {
  config: BeamConfig;
  supports: Support[];
  loads: Load[];
  results: AnalysisResults | null;
}

const AIInsights: React.FC<AIInsightsProps> = ({ config, supports, loads, results }) => {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const generateInsight = async () => {
    if (!results) return;
    setLoading(true);
    try {
      // Fix: Use the standard initialization with process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        As a Senior Structural Engineer, review this beam analysis:
        Beam Length: ${config.length}m
        Supports: ${supports.map(s => `${s.type} at ${s.position}m`).join(', ')}
        Loads: ${loads.map(l => `${l.magnitude}${l.type === 'MOMENT' ? 'kNm' : 'kN'} ${l.type} at ${l.position}m`).join(', ')}
        
        Calculated Max Results:
        - Max Shear: ${results.maxShear.toFixed(2)} kN
        - Max Moment: ${results.maxMoment.toFixed(2)} kNm
        - Max Deflection: ${results.maxDeflection.toFixed(3)} mm
        - Determinacy: ${results.determinacy}
        - Stability: ${results.isStable ? 'Stable' : 'Unstable'}

        Provide 3-4 bullet points with:
        1. Engineering interpretation of the results.
        2. Potential risks or optimization tips (e.g., if deflection is high).
        3. A quick check on stability and determinacy.
        Keep it professional, concise, and insightful.
      `;

      // Fix: Use 'gemini-3-pro-preview' for complex STEM reasoning tasks and include thinking config
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4096 }
        }
      });

      // Fix: Access the text property directly on the response object
      setInsight(response.text || "No insights available.");
    } catch (error) {
      console.error("AI Error:", error);
      setInsight("Failed to load AI insights. Check API configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce AI call to avoid excessive API usage
    const timer = setTimeout(() => {
        if (results) generateInsight();
    }, 1500);
    return () => clearTimeout(timer);
  }, [results]);

  return (
    <div className="bg-indigo-900 text-white p-6 rounded-xl border border-indigo-700 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-200">Engineering Assistant</h2>
        <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] font-bold text-indigo-300">LIVE GEN-AI</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar-light">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-indigo-300">
            <i className="fas fa-cog fa-spin text-3xl"></i>
            <p className="text-xs font-mono animate-pulse">Analyzing beam behavior...</p>
          </div>
        ) : (
          <div className="text-sm leading-relaxed prose prose-invert max-w-none">
            {insight.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line}</p>
            ))}
          </div>
        )}
      </div>
      
      {!loading && !insight && (
        <div className="text-center text-indigo-400 py-10">
            <p className="text-xs italic">Change beam parameters to trigger analysis</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-indigo-800 text-[10px] text-indigo-400 flex items-center justify-between">
        <span>Powered by Gemini 3 Pro</span>
        <button onClick={generateInsight} className="hover:text-white transition-colors">
            <i className="fas fa-sync-alt mr-1"></i> Refresh
        </button>
      </div>
    </div>
  );
};

export default AIInsights;
