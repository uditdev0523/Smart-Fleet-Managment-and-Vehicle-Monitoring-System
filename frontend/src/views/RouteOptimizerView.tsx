import React, { useState, useEffect } from 'react';
import {
  Network,
  GitCompare,
  Share2,
  Package,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../api';

export const RouteOptimizerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compare' | 'clusters' | 'mst' | 'knapsack' | 'tsp'>('compare');

  // Route Compare State
  const [origin, setOrigin] = useState('D1');
  const [destination, setDestination] = useState('D4');
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Clusters State
  const [clustersData, setClustersData] = useState<any | null>(null);

  // MST State
  const [mstData, setMstData] = useState<any | null>(null);

  // Knapsack State
  const [knapsackCapacity, setKnapsackCapacity] = useState(50);
  const [knapsackItems, setKnapsackItems] = useState([
    { id: 1, name: 'Precision Machine Spare A', weight: 10, value: 60 },
    { id: 2, name: 'Medical Cold-Chain Kit B', weight: 20, value: 100 },
    { id: 3, name: 'Industrial Electronics Pack C', weight: 30, value: 120 },
    { id: 4, name: 'Automotive Sensor Consignment D', weight: 15, value: 70 },
  ]);
  const [knapsackResult, setKnapsackResult] = useState<any | null>(null);

  // TSP State
  const [tspResult, setTspResult] = useState<any | null>(null);

  useEffect(() => {
    runComparison();
  }, [origin, destination]);

  const runComparison = async () => {
    setIsComparing(true);
    try {
      const data = await api.compareRoutes(origin, destination);
      setCompareResult(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  const loadClusters = async () => {
    try {
      const data = await api.getClusters();
      setClustersData(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const loadMST = async () => {
    try {
      const data = await api.getMST();
      setMstData(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const runKnapsack = async () => {
    try {
      const res = await api.planKnapsackLoad({
        vehicle_capacity_kg: knapsackCapacity,
        items: knapsackItems,
      });
      setKnapsackResult(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const runTSP = async () => {
    try {
      const distMatrix = [
        [0, 10, 15, 20],
        [10, 0, 35, 25],
        [15, 35, 0, 30],
        [20, 25, 30, 0],
      ];
      const res = await api.computeTSPTour({
        depot_indices: ['D1 (Depot Hub)', 'D2 (Noida)', 'D3 (Ghaziabad)', 'D4 (Delhi)'],
        dist_matrix: distMatrix,
      });
      setTspResult(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Module Sub-Navigation */}
      <div className="bg-white p-2 rounded-lg border border-warmgrey flex flex-wrap gap-2 text-xs shadow-sm">
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'compare' ? 'bg-forest text-white' : 'text-slate hover:bg-ivory hover:text-charcoal'
          }`}
        >
          <GitCompare size={14} />
          <span>BFS vs Dijkstra Routing (Unit 2)</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('clusters');
            loadClusters();
          }}
          className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'clusters' ? 'bg-forest text-white' : 'text-slate hover:bg-ivory hover:text-charcoal'
          }`}
        >
          <Share2 size={14} />
          <span>Network Clusters & Reachability (Unit 2)</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('mst');
            loadMST();
          }}
          className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'mst' ? 'bg-forest text-white' : 'text-slate hover:bg-ivory hover:text-charcoal'
          }`}
        >
          <Network size={14} />
          <span>Prim & Kruskal MST (Unit 2)</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('knapsack');
            runKnapsack();
          }}
          className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'knapsack' ? 'bg-forest text-white' : 'text-slate hover:bg-ivory hover:text-charcoal'
          }`}
        >
          <Package size={14} />
          <span>0/1 Knapsack Cargo Optimizer (Unit 3)</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('tsp');
            runTSP();
          }}
          className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'tsp' ? 'bg-forest text-white' : 'text-slate hover:bg-ivory hover:text-charcoal'
          }`}
        >
          <Layers size={14} />
          <span>Branch & Bound TSP Tour (Unit 4)</span>
        </button>
      </div>

      {/* Tab 1: BFS vs Dijkstra Route Comparison */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          {/* Origin & Destination Selectors */}
          <div className="bg-white p-4 rounded-lg border border-warmgrey shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate mb-1">Origin Vertex</label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="bg-ivory px-3 py-1.5 rounded border border-warmgrey font-bold text-forest text-xs"
                >
                  <option value="D1">D1 - Greater Noida</option>
                  <option value="D2">D2 - Noida Sector 62</option>
                  <option value="D3">D3 - Ghaziabad Freight</option>
                  <option value="D4">D4 - Delhi Anand Vihar</option>
                  <option value="D5">D5 - Meerut Transport Nagar</option>
                </select>
              </div>

              <div className="pt-4 text-terracotta">
                <ArrowRight size={18} />
              </div>

              <div>
                <label className="block text-[11px] text-slate mb-1">Destination Vertex</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-ivory px-3 py-1.5 rounded border border-warmgrey font-bold text-forest text-xs"
                >
                  <option value="D4">D4 - Delhi Anand Vihar</option>
                  <option value="D5">D5 - Meerut Transport Nagar</option>
                  <option value="D1">D1 - Greater Noida</option>
                  <option value="D2">D2 - Noida Sector 62</option>
                  <option value="D3">D3 - Ghaziabad Freight</option>
                </select>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate">
              <span>Standard 5-Depot / 6-Route Regression Fixture</span>
              <div className="text-[10px] text-slate-light">Edges: D1-D2 (4km), D1-D3 (2km), D2-D3 (1km), D2-D4 (5km), D3-D4 (8km), D4-D5 (3km)</div>
            </div>
          </div>

          {/* Side-by-Side Comparison Grid */}
          {compareResult && (
            <div className="space-y-4">
              {/* Insight Callout */}
              <div className="bg-sage-light border border-sage/60 p-3.5 rounded-lg text-xs text-charcoal flex items-start gap-3 shadow-xs">
                <div className="p-1 rounded bg-white text-forest shadow-2xs mt-0.5">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="font-bold text-forest mb-0.5">Algorithm Execution Insight:</div>
                  <div className="text-[11px] leading-relaxed">{compareResult.comparison_insight}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dijkstra Card */}
                <div className="bg-white p-5 rounded-lg border-2 border-forest/30 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-warmgrey">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-operational-success">
                        Shortest Distance Optimization
                      </span>
                      <h3 className="text-sm font-bold text-charcoal">Dijkstra's Algorithm</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-operational-success/10 text-operational-success border border-operational-success/20">
                      {compareResult.dijkstra.time_complexity}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate">Total Path Distance:</span>
                      <span className="text-xl font-bold text-operational-success">
                        {compareResult.dijkstra.total_distance_km} km
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate">Hop Count:</span>
                      <span className="font-semibold text-charcoal">{compareResult.dijkstra.hop_count} hops</span>
                    </div>

                    <div className="pt-2 border-t border-warmgrey">
                      <div className="text-[11px] text-slate mb-1 font-medium">Calculated Route Path:</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {compareResult.dijkstra.path.map((node: string, idx: number) => (
                          <React.Fragment key={idx}>
                            <span className="px-2 py-1 rounded bg-forest text-white font-bold text-xs shadow-2xs">
                              {node}
                            </span>
                            {idx < compareResult.dijkstra.path.length - 1 && (
                              <ArrowRight size={12} className="text-slate" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BFS Card */}
                <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-warmgrey">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta">
                        Fewest Hops Optimization
                      </span>
                      <h3 className="text-sm font-bold text-charcoal">Breadth-First Search (BFS)</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ivory text-slate border border-warmgrey">
                      {compareResult.bfs.time_complexity}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate">Total Path Distance:</span>
                      <span className="text-xl font-bold text-charcoal">
                        {compareResult.bfs.total_distance_km} km
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate">Hop Count:</span>
                      <span className="font-semibold text-terracotta">{compareResult.bfs.hop_count} hops</span>
                    </div>

                    <div className="pt-2 border-t border-warmgrey">
                      <div className="text-[11px] text-slate mb-1 font-medium">Calculated Route Path:</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {compareResult.bfs.path.map((node: string, idx: number) => (
                          <React.Fragment key={idx}>
                            <span className="px-2 py-1 rounded bg-ivory text-charcoal font-bold text-xs border border-warmgrey shadow-2xs">
                              {node}
                            </span>
                            {idx < compareResult.bfs.path.length - 1 && (
                              <ArrowRight size={12} className="text-slate" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supporting Verified Algorithms Panel */}
              <div className="bg-white p-4 rounded-lg border border-warmgrey shadow-sm text-xs">
                <div className="font-bold text-charcoal mb-2">Supporting Algorithm Verifications (Regression Test Fixture)</div>
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div className="p-2.5 bg-ivory rounded border border-warmgrey/70">
                    <div className="text-slate font-medium">Bellman-Ford Algorithm O(VE)</div>
                    <div className="text-charcoal font-semibold mt-0.5">
                      Distance to {destination}: {compareResult.bellman_ford_distance} km
                    </div>
                    <div className="text-[10px] text-slate-light mt-0.5">Detects negative cycle conditions</div>
                  </div>
                  <div className="p-2.5 bg-ivory rounded border border-warmgrey/70">
                    <div className="text-slate font-medium">Floyd-Warshall Algorithm Θ(V³)</div>
                    <div className="text-charcoal font-semibold mt-0.5">
                      All-Pairs matrix [{origin}][{destination}]: {compareResult.floyd_warshall_distance} km
                    </div>
                    <div className="text-[10px] text-slate-light mt-0.5">Global shortest corridor distance</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Connected Components & Clusters */}
      {activeTab === 'clusters' && clustersData && (
        <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-charcoal">Depot Reachability & Isolated Network Clusters</h3>
            <div className="text-[11px] text-slate">
              Disjoint subgraph detection using Breadth-First Search (BFS) in O(V + E) time.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clustersData.clusters.map((c: any) => (
              <div
                key={c.cluster_id}
                className={`p-4 rounded-lg border ${
                  c.is_isolated ? 'bg-operational-warning/5 border-operational-warning/40' : 'bg-ivory border-warmgrey'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-charcoal">
                    Sub-Network Cluster #{c.cluster_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      c.is_isolated
                        ? 'bg-operational-warning/20 text-operational-warning'
                        : 'bg-operational-success/10 text-operational-success'
                    }`}
                  >
                    {c.is_isolated ? 'Isolated Corridor' : 'Connected Main Fleet'}
                  </span>
                </div>
                <div className="text-xs text-slate mb-2">Vertices: {c.depot_count} depots</div>
                <div className="flex gap-1.5 flex-wrap">
                  {c.depots.map((d: string) => (
                    <span key={d} className="px-2 py-1 rounded bg-white text-charcoal font-bold text-xs border border-warmgrey shadow-2xs">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Minimum Spanning Tree */}
      {activeTab === 'mst' && mstData && (
        <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-charcoal">Minimum Spanning Tree (MST) Comparison</h3>
            <div className="text-[11px] text-slate">
              Calculates the minimum total distance to keep every depot vertex connected. Both Prim and Kruskal evaluate to 11 km.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prim */}
            <div className="p-4 rounded-lg bg-ivory border border-warmgrey space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-warmgrey">
                <span className="font-bold text-charcoal">Prim's Algorithm (Min-Heap)</span>
                <span className="text-operational-success font-bold text-sm">
                  {mstData.prim.total_distance_km} km
                </span>
              </div>
              <div className="space-y-1">
                {mstData.prim.edges.map((e: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-warmgrey/40 text-[11px]">
                    <span>{e.from} ↔ {e.to}</span>
                    <span className="font-semibold text-charcoal">{e.weight_km} km</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kruskal */}
            <div className="p-4 rounded-lg bg-ivory border border-warmgrey space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-warmgrey">
                <span className="font-bold text-charcoal">Kruskal's Algorithm (Disjoint Set)</span>
                <span className="text-operational-success font-bold text-sm">
                  {mstData.kruskal.total_distance_km} km
                </span>
              </div>
              <div className="space-y-1">
                {mstData.kruskal.edges.map((e: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-warmgrey/40 text-[11px]">
                    <span>{e.from} ↔ {e.to}</span>
                    <span className="font-semibold text-charcoal">{e.weight_km} km</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 0/1 Knapsack Cargo Optimizer */}
      {activeTab === 'knapsack' && (
        <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-warmgrey">
            <div>
              <h3 className="text-sm font-bold text-charcoal">0/1 Knapsack Dynamic Programming Cargo Packing</h3>
              <div className="text-[11px] text-slate">
                Selects the subset of parcels that maximizes delivery priority without exceeding vehicle payload capacity (Θ(n·W)).
              </div>
            </div>
            <button
              onClick={runKnapsack}
              className="bg-forest text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-forest-light"
            >
              Solve Knapsack
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate font-medium">Vehicle Payload Capacity:</span>
            <input
              type="number"
              value={knapsackCapacity}
              onChange={(e) => setKnapsackCapacity(parseInt(e.target.value) || 1)}
              className="w-24 bg-ivory px-2 py-1 rounded border border-warmgrey font-bold text-forest"
            />
            <span className="text-slate">kg</span>
          </div>

          {knapsackResult && (
            <div className="p-4 rounded-lg bg-ivory border border-warmgrey text-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-warmgrey text-sm">
                <span>Maximum Achieved Priority Value: <strong className="text-terracotta">{knapsackResult.max_priority_value}</strong></span>
                <span>Packed Weight: <strong>{knapsackResult.total_packed_weight_kg} / {knapsackResult.vehicle_capacity_kg} kg</strong></span>
              </div>

              <div>
                <div className="font-bold text-charcoal mb-1">Optimally Selected Cargo Items:</div>
                <div className="space-y-1">
                  {knapsackResult.chosen_items.map((item: any) => (
                    <div key={item.id} className="p-2 bg-white rounded border border-warmgrey flex justify-between text-[11px]">
                      <span className="font-semibold text-charcoal">{item.name}</span>
                      <span className="text-slate">{item.weight} kg • Priority: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Branch and Bound TSP Tour */}
      {activeTab === 'tsp' && tspResult && (
        <div className="bg-white p-5 rounded-lg border border-warmgrey shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-charcoal">Multi-Stop Delivery Tour (Branch & Bound TSP)</h3>
            <div className="text-[11px] text-slate">
              Branch and Bound algorithm computes the optimal closed circuit visiting all depots with pruned state-space tree.
            </div>
          </div>

          <div className="p-4 rounded-lg bg-ivory border border-warmgrey text-xs space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Optimal Tour Total Distance:</span>
              <span className="font-bold text-operational-success text-base">{tspResult.minimum_tour_cost} km</span>
            </div>

            <div className="pt-2 border-t border-warmgrey">
              <div className="text-slate mb-1">Ordered Circuit:</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {tspResult.ordered_tour.map((stop: string, idx: number) => (
                  <React.Fragment key={idx}>
                    <span className="px-2.5 py-1 rounded bg-forest text-white font-bold text-xs">
                      {stop}
                    </span>
                    {idx < tspResult.ordered_tour.length - 1 && (
                      <ArrowRight size={13} className="text-terracotta" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
