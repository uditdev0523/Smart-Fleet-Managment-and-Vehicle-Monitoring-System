"""
Route Optimization and DSA Integration API Routes
Exposes verified implementations of Graph, BFS, Dijkstra, Bellman-Ford, Floyd-Warshall,
Prim/Kruskal MST, Connected Components, 0/1 Knapsack, and Branch & Bound TSP.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Route, Depot, User
from auth import get_current_user
from fleet_dsa import (
    Graph, bfs_hops, dfs_order, connected_components,
    dijkstra, bellman_ford, floyd_warshall, prim_mst, kruskal_mst,
    knapsack_01, find_exact_load_subset, delivery_tour_branch_and_bound,
    lcs
)

router = APIRouter(prefix="/api/dsa", tags=["Route Optimization & DSA"])


def build_graph_from_db(db: Session, org_id: int) -> Graph:
    routes = db.query(Route).filter(Route.organization_id == org_id).all()
    g = Graph()
    for r in routes:
        g.add_edge(r.from_depot_code, r.to_depot_code, r.distance_km)
    return g


class KnapsackRequest(BaseModel):
    vehicle_capacity_kg: float
    items: List[dict] # [{"id": 1, "name": "Item A", "weight": 20, "value": 100}]


class TSPRequest(BaseModel):
    depot_indices: List[str] # ["D1", "D2", "D3", "D4"]
    dist_matrix: List[List[float]]


@router.get("/depots")
def get_depots(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    depots = db.query(Depot).filter(Depot.organization_id == current_user.organization_id).all()
    return [
        {
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "location_name": d.location_name,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "capacity": d.capacity_vehicles
        }
        for d in depots
    ]


@router.get("/corridors")
def get_corridors(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    routes = db.query(Route).filter(Route.organization_id == current_user.organization_id).all()
    return [
        {
            "id": r.id,
            "from": r.from_depot_code,
            "to": r.to_depot_code,
            "distance_km": r.distance_km,
            "corridor_name": r.corridor_name,
            "estimated_minutes": r.estimated_minutes
        }
        for r in routes
    ]


@router.get("/route-compare")
def compare_routes(
    origin: str = Query("D1"),
    destination: str = Query("D4"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compares Fewest-Hop Path (BFS) vs Shortest-Distance Path (Dijkstra)
    along with Bellman-Ford and Floyd-Warshall verified outputs.
    """
    g = build_graph_from_db(db, current_user.organization_id)

    if origin not in g.adj or destination not in g.adj:
        raise HTTPException(status_code=400, detail=f"Invalid depots: {origin} or {destination} not in graph")

    # 1. Dijkstra Shortest-Distance
    dijkstra_dist, dijkstra_path = dijkstra(g, origin, destination)

    # 2. BFS Fewest Hops
    # Reconstruct BFS path
    bfs_dist_hops = bfs_hops(g, origin)
    # Trace BFS path by reverse traversal
    bfs_path = [origin]
    if origin == destination:
        bfs_path = [origin]
    else:
        # Standard BFS parent trace
        parent = {origin: None}
        q = [origin]
        found = False
        visited = {origin}
        while q and not found:
            curr = q.pop(0)
            for neighbor, _ in g.adj[curr]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    parent[neighbor] = curr
                    q.append(neighbor)
                    if neighbor == destination:
                        found = True
                        break
        if found:
            curr = destination
            bfs_path = []
            while curr is not None:
                bfs_path.append(curr)
                curr = parent[curr]
            bfs_path.reverse()

    # Calculate actual distance of BFS path
    bfs_total_km = 0.0
    for i in range(len(bfs_path) - 1):
        u, v = bfs_path[i], bfs_path[i + 1]
        for neighbor, w in g.adj[u]:
            if neighbor == v:
                bfs_total_km += w
                break

    # 3. Bellman-Ford Verification
    bf_dist = bellman_ford(g, origin)

    # 4. Floyd-Warshall All-Pairs
    fw_matrix = floyd_warshall(g)

    # Explanatory narrative
    diff_km = round(bfs_total_km - dijkstra_dist, 2)
    diff_hops = (len(dijkstra_path) - 1) - (len(bfs_path) - 1)
    if diff_km > 0:
        insight = (
            f"Fewest hops does not equal shortest distance! "
            f"BFS reached {destination} in {len(bfs_path) - 1} hops ({bfs_total_km} km), "
            f"but Dijkstra found a route with {diff_hops} extra hop(s) that saves {diff_km} km "
            f"(Total: {dijkstra_dist} km). Dijkstra minimizes fuel and tire wear."
        )
    else:
        insight = f"Both algorithms identified equivalent distance paths ({dijkstra_dist} km)."

    return {
        "origin": origin,
        "destination": destination,
        "dijkstra": {
            "algorithm": "Dijkstra's Algorithm (Priority Queue)",
            "path": dijkstra_path,
            "total_distance_km": dijkstra_dist,
            "hop_count": len(dijkstra_path) - 1,
            "time_complexity": "O((V + E) log V)"
        },
        "bfs": {
            "algorithm": "Breadth-First Search (Queue)",
            "path": bfs_path,
            "total_distance_km": bfs_total_km,
            "hop_count": len(bfs_path) - 1,
            "time_complexity": "O(V + E)"
        },
        "bellman_ford_distance": bf_dist.get(destination),
        "floyd_warshall_distance": fw_matrix.get(origin, {}).get(destination),
        "comparison_insight": insight
    }


@router.get("/clusters")
def get_connected_clusters(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Connected Components (Unit 2) to detect isolated depot networks."""
    g = build_graph_from_db(db, current_user.organization_id)
    comps = connected_components(g)
    return {
        "algorithm": "Connected Components via BFS (Unit 2)",
        "cluster_count": len(comps),
        "clusters": [
            {
                "cluster_id": idx + 1,
                "depot_count": len(comp),
                "depots": comp,
                "is_isolated": len(comp) < len(g.vertices()) / 2
            }
            for idx, comp in enumerate(comps)
        ]
    }


@router.get("/mst")
def get_minimum_spanning_tree(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Minimum Spanning Tree comparing Prim and Kruskal."""
    g = build_graph_from_db(db, current_user.organization_id)
    prim_cost, prim_edges = prim_mst(g, "D1")
    kruskal_cost, kruskal_edges = kruskal_mst(g)

    return {
        "prim": {
            "algorithm": "Prim's Algorithm (Min Heap)",
            "total_distance_km": prim_cost,
            "edges": [{"from": u, "to": v, "weight_km": w} for u, v, w in prim_edges],
            "time_complexity": "O(E log V)"
        },
        "kruskal": {
            "algorithm": "Kruskal's Algorithm (Disjoint Set Union)",
            "total_distance_km": kruskal_cost,
            "edges": [{"from": u, "to": v, "weight_km": w} for u, v, w in kruskal_edges],
            "time_complexity": "O(E log E)"
        },
        "agreement": prim_cost == kruskal_cost
    }


@router.post("/knapsack-load")
def plan_knapsack_load(req: KnapsackRequest):
    """0/1 Knapsack dynamic programming algorithm for cargo payload packing."""
    weights = [int(item["weight"]) for item in req.items]
    values = [int(item["value"]) for item in req.items]
    cap = int(req.vehicle_capacity_kg)

    max_val, chosen_indices = knapsack_01(cap, weights, values)
    chosen_items = [req.items[i] for i in chosen_indices]
    total_packed_weight = sum(item["weight"] for item in chosen_items)

    return {
        "algorithm": "0/1 Knapsack Dynamic Programming (Unit 3)",
        "vehicle_capacity_kg": req.vehicle_capacity_kg,
        "max_priority_value": max_val,
        "total_packed_weight_kg": total_packed_weight,
        "remaining_capacity_kg": req.vehicle_capacity_kg - total_packed_weight,
        "chosen_items": chosen_items,
        "time_complexity": "Theta(n * W)"
    }


@router.post("/delivery-tour")
def compute_tsp_tour(req: TSPRequest):
    """Branch and Bound Travelling Salesperson Problem (TSP) for route delivery stops."""
    cost, tour = delivery_tour_branch_and_bound(req.dist_matrix)
    named_tour = [req.depot_indices[i] for i in tour]
    return {
        "algorithm": "Branch and Bound TSP Tour (Unit 4)",
        "minimum_tour_cost": cost,
        "tour_indices": tour,
        "ordered_tour": named_tour,
        "explanation": f"Optimal closed cycle visiting all {len(req.depot_indices)} stops with minimum total distance of {cost} km."
    }
