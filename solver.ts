
import { SupportType, LoadType, Support, Load, BeamConfig, AnalysisResults, ILDPoint } from './types';

class LUSolver {
  n: number;
  LU: number[][];
  pivot: number[];

  constructor(matrix: number[][]) {
    this.n = matrix.length;
    this.LU = matrix.map(row => [...row]);
    this.pivot = Array.from({ length: this.n }, (_, i) => i);

    for (let i = 0; i < this.n; i++) {
      let max = 0;
      let row = i;
      for (let k = i; k < this.n; k++) {
        const val = Math.abs(this.LU[k][i]);
        if (val > max) { max = val; row = k; }
      }
      if (max < 1e-18) continue; 
      [this.LU[i], this.LU[row]] = [this.LU[row], this.LU[i]];
      [this.pivot[i], this.pivot[row]] = [this.pivot[row], this.pivot[i]];

      for (let j = i + 1; j < this.n; j++) {
        this.LU[j][i] /= this.LU[i][i];
        for (let k = i + 1; k < this.n; k++) {
          this.LU[j][k] -= this.LU[j][i] * this.LU[i][k];
        }
      }
    }
  }

  solve(b: number[]): number[] {
    const x = Array(this.n).fill(0);
    const y = Array(this.n).fill(0);
    for (let i = 0; i < this.n; i++) {
      let sum = 0;
      for (let j = 0; j < i; j++) sum += this.LU[i][j] * y[j];
      y[i] = b[this.pivot[i]] - sum;
    }
    for (let i = this.n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < this.n; j++) sum += this.LU[i][j] * x[j];
      if (Math.abs(this.LU[i][i]) < 1e-22) x[i] = 0;
      else x[i] = (y[i] - sum) / this.LU[i][i];
    }
    return x;
  }
}

function elementStiffness(EI: number, L: number): number[][] {
  const L2 = L * L, L3 = L2 * L;
  return [
    [12 * EI / L3, 6 * EI / L2, -12 * EI / L3, 6 * EI / L2],
    [6 * EI / L2, 4 * EI / L, -6 * EI / L2, 2 * EI / L],
    [-12 * EI / L3, -6 * EI / L2, 12 * EI / L3, -6 * EI / L2],
    [6 * EI / L2, 2 * EI / L, -6 * EI / L2, 4 * EI / L]
  ];
}

function applyMomentRelease(ke: number[][], fe: number[], releaseStart: boolean, releaseEnd: boolean) {
  const releases = [];
  if (releaseStart) releases.push(1);
  if (releaseEnd) releases.push(3);

  for (const r of releases) {
    const krr = ke[r][r];
    if (Math.abs(krr) < 1e-12) continue;

    const fr = fe[r];
    for (let i = 0; i < 4; i++) {
      fe[i] = fe[i] - (ke[i][r] / krr) * fr;
      for (let j = 0; j < 4; j++) {
        ke[i][j] = ke[i][j] - (ke[i][r] * ke[r][j]) / krr;
      }
    }
  }
}

function findClosestNodeIndex(nodes: number[], x: number): number {
  let minDiff = Infinity, idx = 0;
  for (let i = 0; i < nodes.length; i++) {
    const d = Math.abs(nodes[i] - x);
    if (d < minDiff) { minDiff = d; idx = i; }
  }
  return idx;
}

export function analyzeBeam(config: BeamConfig, supports: Support[], loads: Load[], probeX: number): AnalysisResults {
  const L = config.length;
  const E = config.elasticModulus * 1e6;
  const I = config.momentOfInertia * 1e-12;
  const EI = E * I;

  // Safety guard against invalid geometry
  if (L <= 0 || EI <= 0) {
      throw new Error("Invalid beam geometry");
  }

  const criticalX = new Set<number>([0, L, probeX]);
  supports.forEach(s => criticalX.add(s.position));
  loads.forEach(l => {
    criticalX.add(l.position);
    if ((l.type === LoadType.UDL || l.type === LoadType.UVL) && l.endPosition !== undefined) criticalX.add(l.endPosition);
  });

  const sortedX = Array.from(criticalX).sort((a, b) => a - b);
  const finalNodes: number[] = [];
  const minInterval = Math.max(0.1, L / 100); 

  for (let i = 0; i < sortedX.length - 1; i++) {
    const start = sortedX[i], end = sortedX[i + 1];
    finalNodes.push(start);
    const numSub = Math.max(1, Math.ceil((end - start) / minInterval));
    for (let j = 1; j < numSub; j++) finalNodes.push(start + (j * (end - start)) / numSub);
  }
  finalNodes.push(L);

  const numNodes = finalNodes.length;
  const totalDof = numNodes * 2;
  
  const hingeNodes = new Set<number>();
  supports.forEach(s => {
    if (s.type === SupportType.HINGE) {
      hingeNodes.add(findClosestNodeIndex(finalNodes, s.position));
    }
  });

  const K = Array(totalDof).fill(0).map(() => new Float64Array(totalDof));
  for (let i = 0; i < numNodes - 1; i++) {
    const x1 = finalNodes[i], x2 = finalNodes[i + 1], Le = x2 - x1;
    if (Le <= 0) continue;
    const ke = elementStiffness(EI, Le);
    const dummyFe = [0,0,0,0];
    const releaseStart = hingeNodes.has(i);
    const releaseEnd = hingeNodes.has(i + 1);
    if (releaseStart || releaseEnd) {
      applyMomentRelease(ke, dummyFe, releaseStart, releaseEnd);
    }
    const idxs = [i * 2, i * 2 + 1, (i + 1) * 2, (i + 1) * 2 + 1];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        K[idxs[r]][idxs[c]] += ke[r][c];
      }
    }
  }

  const penalty = 1e18 * EI;
  supports.forEach(s => {
    const idx = findClosestNodeIndex(finalNodes, s.position);
    if (s.type === SupportType.FIXED) { 
      K[idx * 2][idx * 2] += penalty; 
      K[idx * 2 + 1][idx * 2 + 1] += penalty; 
    } else if (s.type === SupportType.PINNED || s.type === SupportType.ROLLER) { 
      K[idx * 2][idx * 2] += penalty; 
    }
  });

  const matrixForLU = K.map(row => Array.from(row));
  const solver = new LUSolver(matrixForLU);

  const buildLoadVector = (currentLoads: Load[]) => {
    const F = new Float64Array(totalDof);
    
    // Performance optimization: only check elements if distributed loads exist
    const hasDistributed = currentLoads.some(l => l.type === LoadType.UDL || l.type === LoadType.UVL);
    
    if (hasDistributed) {
      for (let i = 0; i < numNodes - 1; i++) {
        const x1 = finalNodes[i], x2 = finalNodes[i + 1], Le = x2 - x1;
        if (Le <= 0) continue;
        const fe = new Float64Array(4);

        currentLoads.forEach(load => {
          if (load.type === LoadType.UDL || load.type === LoadType.UVL) {
            const xA = Math.max(x1, load.position), xB = Math.min(x2, load.endPosition!);
            if (xA < xB - 1e-9) {
              const wStart = load.magnitude, wEnd = load.type === LoadType.UVL ? (load.endMagnitude ?? wStart) : wStart;
              const t1 = (xA - load.position) / (load.endPosition! - load.position);
              const t2 = (xB - load.position) / (load.endPosition! - load.position);
              const q1 = (wStart + (wEnd - wStart) * t1) * 1000;
              const q2 = (wStart + (wEnd - wStart) * t2) * 1000;
              const loadLen = xB - xA;
              const totalW = (q1 + q2) * loadLen / 2;
              fe[0] -= totalW / 2;
              fe[2] -= totalW / 2;
              const mFE = (q1 + q2) * loadLen * loadLen / 24;
              fe[1] -= mFE;
              fe[3] += mFE;
            }
          }
        });

        const releaseStart = hingeNodes.has(i);
        const releaseEnd = hingeNodes.has(i + 1);
        if (releaseStart || releaseEnd) {
          const dummyKe = elementStiffness(EI, Le);
          const feArr = Array.from(fe);
          applyMomentRelease(dummyKe, feArr, releaseStart, releaseEnd);
          fe.set(feArr);
        }

        const idxs = [i * 2, i * 2 + 1, (i + 1) * 2, (i + 1) * 2 + 1];
        for (let r = 0; r < 4; r++) F[idxs[r]] += fe[r];
      }
    }

    currentLoads.forEach(load => {
      if (load.type === LoadType.POINT) {
        const idx = findClosestNodeIndex(finalNodes, load.position);
        F[idx * 2] -= load.magnitude * 1000;
      } else if (load.type === LoadType.MOMENT) {
        const idx = findClosestNodeIndex(finalNodes, load.position);
        F[idx * 2 + 1] += load.magnitude * 1000;
      }
    });
    return Array.from(F);
  };

  const F_main = buildLoadVector(loads);
  const U = solver.solve(F_main);

  const getInternalAt = (dispVector: number[], xTarget: number, currentLoads: Load[], side: 'left' | 'right' = 'left') => {
    const nodeIdx = findClosestNodeIndex(finalNodes, xTarget);
    let elemIdx = side === 'left' ? nodeIdx - 1 : nodeIdx;
    if (elemIdx < 0) elemIdx = 0;
    if (elemIdx >= numNodes - 1) elemIdx = numNodes - 2;

    const x1 = finalNodes[elemIdx], x2 = finalNodes[elemIdx + 1], Le = x2 - x1;
    if (Le <= 0) return { shear: 0, moment: 0 };
    const ke = elementStiffness(EI, Le);
    const fe = [0, 0, 0, 0];
    
    currentLoads.forEach(load => {
      if (load.type === LoadType.UDL || load.type === LoadType.UVL) {
        const xA = Math.max(x1, load.position), xB = Math.min(x2, load.endPosition!);
        if (xA < xB - 1e-9) {
          const wStart = load.magnitude, wEnd = load.type === LoadType.UVL ? (load.endMagnitude ?? wStart) : wStart;
          const t1 = (xA - load.position) / (load.endPosition! - load.position);
          const t2 = (xB - load.position) / (load.endPosition! - load.position);
          const q1 = (wStart + (wEnd - wStart) * t1) * 1000;
          const q2 = (wStart + (wEnd - wStart) * t2) * 1000;
          const loadLen = xB - xA;
          fe[0] -= (q1 + q2) * loadLen / 4;
          fe[2] -= (q1 + q2) * loadLen / 4;
          const mFE = (q1 + q2) * loadLen * loadLen / 24;
          fe[1] -= mFE;
          fe[3] += mFE;
        }
      }
    });

    const releaseStart = hingeNodes.has(elemIdx);
    const releaseEnd = hingeNodes.has(elemIdx + 1);
    if (releaseStart || releaseEnd) {
      applyMomentRelease(ke, fe, releaseStart, releaseEnd);
    }

    const u_e = [dispVector[elemIdx * 2], dispVector[elemIdx * 2 + 1], dispVector[(elemIdx + 1) * 2], dispVector[(elemIdx + 1) * 2 + 1]];
    const f = [...fe];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        f[r] += ke[r][c] * u_e[c];
      }
    }

    if (nodeIdx === elemIdx) return { shear: f[0] / 1000, moment: -f[1] / 1000 };
    return { shear: -f[2] / 1000, moment: f[3] / 1000 };
  };

  const shear: number[] = Array(numNodes).fill(0), moment: number[] = Array(numNodes).fill(0);
  const deflection: number[] = U.filter((_, i) => i % 2 === 0).map(v => v * 1000);
  
  for (let i = 0; i < numNodes; i++) {
    const int = getInternalAt(U, finalNodes[i], loads);
    shear[i] = int.shear; 
    moment[i] = Math.abs(int.moment) < 1e-7 ? 0 : int.moment;
  }

  const reactions = supports.filter(s => s.type !== SupportType.HINGE).map((s, idx) => {
    const nIdx = findClosestNodeIndex(finalNodes, s.position);
    const f = (penalty * U[nIdx * 2]) / -1000;
    const m = (s.type === SupportType.FIXED ? (penalty * U[nIdx * 2 + 1]) / 1000 : 0);
    return { position: s.position, force: f, moment: m, label: `R${idx + 1}`, id: s.id };
  });

  const ildReactions: { [supportId: string]: ILDPoint[] } = {};
  const ildShearAtProbe: ILDPoint[] = [];
  const ildMomentAtProbe: ILDPoint[] = [];
  supports.forEach(s => { if(s.type !== SupportType.HINGE) ildReactions[s.id] = []; });

  const reactionCount = supports.reduce((acc, s) => acc + (s.type === SupportType.FIXED ? 2 : (s.type === SupportType.HINGE ? 0 : 1)), 0);
  const hingesCount = hingeNodes.size;
  const isStable = reactionCount >= 3;

  if (isStable) {
    const steps = 30; 
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * L;
      const unitLoad = [{ id: 'unit', type: LoadType.POINT, magnitude: 1, position: x }];
      const F_ild = buildLoadVector(unitLoad);
      const U_ild = solver.solve(F_ild); 
      
      supports.forEach(s => {
        if(s.type === SupportType.HINGE) return;
        const nIdx = findClosestNodeIndex(finalNodes, s.position);
        ildReactions[s.id].push({ x, value: (penalty * U_ild[nIdx * 2]) / -1000 });
      });

      const side = x <= probeX ? 'right' : 'left'; 
      const int_ild = getInternalAt(U_ild, probeX, unitLoad, side);
      ildShearAtProbe.push({ x, value: int_ild.shear });
      ildMomentAtProbe.push({ x, value: int_ild.moment });
    }
  }

  return {
    nodes: finalNodes, shearForce: shear, bendingMoment: moment, deflection,
    reactions, maxShear: Math.max(...shear), minShear: Math.min(...shear),
    maxMoment: Math.max(...moment), minMoment: Math.min(...moment),
    maxDeflection: Math.max(...deflection), minDeflection: Math.min(...deflection),
    determinacy: reactionCount - 3 - hingesCount, isStable,
    ildReactions, ildShearAtProbe, ildMomentAtProbe
  };
}
