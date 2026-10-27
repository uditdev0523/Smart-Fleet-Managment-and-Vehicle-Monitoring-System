"""
FleetOps - Smart Fleet Management System
DSA Demonstration Script reproducing Appendix D results.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fleet_dsa import (
    VehicleBST, VehicleAVLTree, MaintenanceMaxHeap,
    Graph, bfs_hops, dfs_order, connected_components,
    dijkstra, bellman_ford, floyd_warshall, prim_mst, kruskal_mst,
    knapsack_01, lcs, allocate_workshop_hours,
    find_exact_load_subset, delivery_tour_branch_and_bound,
    DisjointSet, RegistrationTrie, FuelSegmentTree
)


def run_demo():
    print("== Unit 2: Graph (5 depots, 6 routes) ==")
    g = Graph()
    g.add_edge('D1', 'D2', 4)
    g.add_edge('D1', 'D3', 2)
    g.add_edge('D2', 'D3', 1)
    g.add_edge('D2', 'D4', 5)
    g.add_edge('D3', 'D4', 8)
    g.add_edge('D4', 'D5', 3)

    hops = bfs_hops(g, 'D1')
    print(f"BFS hops from D1      : {hops}")
    print(f"DFS order from D1     : {dfs_order(g, 'D1')}")
    print(f"Components            : {connected_components(g)}")
    print(f"Shortest D1->D4 (km)  : {dijkstra(g, 'D1', 'D4')}")
    print(f"Shortest D1->D5 (km)  : {dijkstra(g, 'D1', 'D5')}")
    print(f"Bellman-Ford from D1  : {bellman_ford(g, 'D1')}")
    print(f"Floyd-Warshall D1 row : {floyd_warshall(g)['D1']}")
    print(f"Prim MST from D1      : {prim_mst(g, 'D1')}")
    print(f"Kruskal MST           : {kruskal_mst(g)}")

    print("== Unit 3: Dynamic programming ==")
    print(f"Knapsack (cap 50 kg)  : {knapsack_01(50, [10, 20, 30], [60, 100, 120])}")
    print(f"LCS of two routes     : {lcs(['A', 'B', 'C', 'D', 'E'], ['A', 'C', 'D', 'F', 'E'])}")
    print(f"Workshop hours (5 h)  : {allocate_workshop_hours(5, [2, 3, 4], [3, 4, 5])}")

    print("== Unit 1: Trees and heaps ==")
    bst = VehicleBST()
    for k in [50, 30, 70, 20, 40, 60, 80]:
        bst.insert(k, f"V{k}")
    print(f"BST search 60 / 65    : {bst.search(60)} / {bst.search(65)}")
    print(f"BST in-order          : {bst.in_order_keys()}")

    avl = VehicleAVLTree()
    for i in range(1, 16):
        avl.insert(i, f"V{i}")
    print(f"AVL height (15 sorted inserts): {avl.get_height()}")

    h = MaintenanceMaxHeap()
    h.push(3, 'V1')
    h.push(9, 'V2')
    h.push(5, 'V3')
    h.push(7, 'V4')
    pop_order = []
    while not h.is_empty():
        pop_order.append(h.pop())
    print(f"Max heap pop order    : {pop_order}")

    print("== Unit 4: Backtracking and branch and bound ==")
    subset21 = find_exact_load_subset(21, [12, 7, 9, 5])
    print(f"Parcels for 21 kg load: {subset21} -> {[ [12, 7, 9, 5][i] for i in subset21 ]}")
    print(f"Parcels for 5 kg load : {find_exact_load_subset(5, [4, 6])}")

    dist_matrix = [
        [0, 10, 15, 20],
        [10, 0, 35, 25],
        [15, 35, 0, 30],
        [20, 25, 30, 0]
    ]
    print(f"Delivery tour (B&B)   : {delivery_tour_branch_and_bound(dist_matrix)}")

    print("== Unit 5: Advanced data structures ==")
    trie = RegistrationTrie()
    trie.insert('UP32AB1234')
    trie.insert('UP32AB5678')
    trie.insert('DL01CD9999')
    print(f"Trie prefix 'UP32'    : {trie.starts_with('UP32')}")

    st = FuelSegmentTree([5, 10, 7, 8, 19])
    print(f"Fuel sum days 1-4 (L) : {st.query_range(0, 3)}")
    st.update_point(1, 20)
    print(f"After day 2 -> 20 L   : {st.query_range(0, 3)}")

    dsu = DisjointSet(['D1', 'D2', 'D3', 'X1'])
    dsu.union('D1', 'D2')
    dsu.union('D2', 'D3')
    print(f"Same cluster D1,D3 / D1,X1: {dsu.connected('D1', 'D3')} / {dsu.connected('D1', 'X1')}")


if __name__ == '__main__':
    run_demo()
