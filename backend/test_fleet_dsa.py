import unittest
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fleet_dsa import (
    VehicleBST, VehicleAVLTree, MaintenanceMaxHeap,
    Graph, bfs_hops, dfs_order, connected_components,
    dijkstra, bellman_ford, floyd_warshall, prim_mst, kruskal_mst,
    knapsack_01, lcs, allocate_workshop_hours,
    find_exact_load_subset, delivery_tour_branch_and_bound,
    DisjointSet, RegistrationTrie, FuelSegmentTree
)


def create_sample_graph():
    """5 depots, 6 routes standard sample network:
    D1 - D2: 4 km
    D1 - D3: 2 km
    D2 - D3: 1 km
    D2 - D4: 5 km
    D3 - D4: 8 km
    D4 - D5: 3 km
    """
    g = Graph()
    g.add_edge('D1', 'D2', 4)
    g.add_edge('D1', 'D3', 2)
    g.add_edge('D2', 'D3', 1)
    g.add_edge('D2', 'D4', 5)
    g.add_edge('D3', 'D4', 8)
    g.add_edge('D4', 'D5', 3)
    return g


class TestFleetDSA(unittest.TestCase):

    # 1. test_bfs
    def test_bfs(self):
        g = create_sample_graph()
        hops = bfs_hops(g, 'D1')
        expected = {'D1': 0, 'D2': 1, 'D3': 1, 'D4': 2, 'D5': 3}
        self.assertEqual(hops, expected)

    # 2. test_dfs
    def test_dfs(self):
        g = create_sample_graph()
        order = dfs_order(g, 'D1')
        self.assertEqual(set(order), {'D1', 'D2', 'D3', 'D4', 'D5'})
        self.assertEqual(len(order), 5)

    # 3. test_components
    def test_components(self):
        g = create_sample_graph()
        g.add_edge('X1', 'X2', 10)
        comps = connected_components(g)
        self.assertEqual(len(comps), 2)
        self.assertEqual(comps[0], ['D1', 'D2', 'D3', 'D4', 'D5'])
        self.assertEqual(comps[1], ['X1', 'X2'])

    # 4. test_dijkstra
    def test_dijkstra(self):
        g = create_sample_graph()
        cost_d4, path_d4 = dijkstra(g, 'D1', 'D4')
        self.assertEqual(cost_d4, 8)
        self.assertEqual(path_d4, ['D1', 'D3', 'D2', 'D4'])

        cost_d5, path_d5 = dijkstra(g, 'D1', 'D5')
        self.assertEqual(cost_d5, 11)
        self.assertEqual(path_d5, ['D1', 'D3', 'D2', 'D4', 'D5'])

    # 5. test_bfs_vs_dijkstra
    def test_bfs_vs_dijkstra(self):
        g = create_sample_graph()
        # BFS path reaches D4 in 2 hops (D1 -> D2 -> D4 = 4+5 = 9 km)
        hops = bfs_hops(g, 'D1')
        self.assertEqual(hops['D4'], 2)

        # Dijkstra chooses 3 hops (D1 -> D3 -> D2 -> D4 = 2+1+5 = 8 km)
        cost, path = dijkstra(g, 'D1', 'D4')
        self.assertEqual(cost, 8)
        self.assertEqual(len(path) - 1, 3)
        self.assertLess(cost, 9)

    # 6. test_bellman_ford
    def test_bellman_ford(self):
        g = create_sample_graph()
        dist = bellman_ford(g, 'D1')
        self.assertEqual(dist['D1'], 0)
        self.assertEqual(dist['D2'], 3)
        self.assertEqual(dist['D3'], 2)
        self.assertEqual(dist['D4'], 8)
        self.assertEqual(dist['D5'], 11)

    # 7. test_floyd
    def test_floyd(self):
        g = create_sample_graph()
        matrix = floyd_warshall(g)
        self.assertEqual(matrix['D1']['D5'], 11)
        self.assertEqual(matrix['D1']['D4'], 8)
        self.assertEqual(matrix['D3']['D5'], 9)

    # 8. test_prim_kruskal
    def test_prim_kruskal(self):
        g = create_sample_graph()
        prim_cost, prim_edges = prim_mst(g, 'D1')
        kruskal_cost, kruskal_edges = kruskal_mst(g)
        self.assertEqual(prim_cost, 11)
        self.assertEqual(kruskal_cost, 11)

    # 9. test_knapsack
    def test_knapsack(self):
        weights = [10, 20, 30]
        values = [60, 100, 120]
        capacity = 50
        val, chosen = knapsack_01(capacity, weights, values)
        self.assertEqual(val, 220)
        self.assertEqual(chosen, [1, 2])

    # 10. test_lcs
    def test_lcs(self):
        seq1 = ['A', 'B', 'C', 'D', 'E']
        seq2 = ['A', 'C', 'D', 'F', 'E']
        length, elements = lcs(seq1, seq2)
        self.assertEqual(length, 4)
        self.assertEqual(elements, ['A', 'C', 'D', 'E'])

    # 11. test_workshop
    def test_workshop(self):
        job_hours = [2, 3, 4]
        job_priorities = [3, 4, 5]
        available_hours = 5
        val, chosen = allocate_workshop_hours(available_hours, job_hours, job_priorities)
        self.assertEqual(val, 7)
        self.assertEqual(chosen, [0, 1])

    # 12. test_bst
    def test_bst(self):
        bst = VehicleBST()
        for k in [50, 30, 70, 20, 40, 60, 80]:
            bst.insert(k, f"V{k}")
        self.assertEqual(bst.search(60), "V60")
        self.assertIsNone(bst.search(65))
        self.assertEqual(bst.in_order_keys(), [20, 30, 40, 50, 60, 70, 80])

    # 13. test_heap
    def test_heap(self):
        h = MaintenanceMaxHeap()
        h.push(3, 'V1')
        h.push(9, 'V2')
        h.push(5, 'V3')
        h.push(7, 'V4')

        peek_item = h.peek()
        self.assertEqual(peek_item, (9, 'V2'))

        order = []
        while not h.is_empty():
            order.append(h.pop())
        self.assertEqual(order, [(9, 'V2'), (7, 'V4'), (5, 'V3'), (3, 'V1')])

    # 14. test_avl_balanced
    def test_avl_balanced(self):
        avl = VehicleAVLTree()
        for i in range(1, 16):
            avl.insert(i, f"Vehicle_{i}")
        self.assertEqual(avl.get_height(), 4)
        self.assertEqual(avl.in_order_keys(), list(range(1, 16)))
        self.assertEqual(avl.search(8), "Vehicle_8")
        self.assertIsNone(avl.search(99))

    # 15. test_backtracking
    def test_backtracking(self):
        parcels = [12, 7, 9, 5]
        chosen = find_exact_load_subset(21, parcels)
        self.assertIsNotNone(chosen)
        self.assertEqual(sum(parcels[i] for i in chosen), 21)

        impossible = find_exact_load_subset(5, [4, 6])
        self.assertIsNone(impossible)

    # 16. test_branch_and_bound
    def test_branch_and_bound(self):
        # 4 stops matrix
        dist_matrix = [
            [0, 10, 15, 20],
            [10, 0, 35, 25],
            [15, 35, 0, 30],
            [20, 25, 30, 0]
        ]
        cost, tour = delivery_tour_branch_and_bound(dist_matrix)
        self.assertEqual(cost, 80)
        self.assertEqual(tour[0], 0)
        self.assertEqual(tour[-1], 0)
        self.assertEqual(len(tour), 5)

    # 17. test_disjoint_set
    def test_disjoint_set(self):
        dsu = DisjointSet(['D1', 'D2', 'D3', 'X1'])
        self.assertTrue(dsu.union('D1', 'D2'))
        self.assertTrue(dsu.union('D2', 'D3'))
        self.assertFalse(dsu.union('D1', 'D3')) # already connected
        self.assertTrue(dsu.connected('D1', 'D3'))
        self.assertFalse(dsu.connected('D1', 'X1'))

    # 18. test_trie
    def test_trie(self):
        trie = RegistrationTrie()
        trie.insert('UP32AB1234', {'model': 'Tata Prima'})
        trie.insert('UP32AB5678', {'model': 'Ashok Leyland'})
        trie.insert('DL01CD9999', {'model': 'Eicher Pro'})

        exact_found, payload = trie.search_exact('UP32AB1234')
        self.assertTrue(exact_found)
        self.assertEqual(payload['model'], 'Tata Prima')

        prefix_matches = trie.starts_with('UP32')
        self.assertEqual(prefix_matches, ['UP32AB1234', 'UP32AB5678'])

        non_complete, _ = trie.search_exact('UP32')
        self.assertFalse(non_complete)

    # 19. test_segment_tree
    def test_segment_tree(self):
        # Days 1 to 5 fuel readings: [5, 10, 7, 8, 19]
        st = FuelSegmentTree([5, 10, 7, 8, 19])
        # Range sum days 1-4 (0 to 3): 5 + 10 + 7 + 8 = 30
        self.assertEqual(st.query_range(0, 3), 30)
        # Range sum days 1-5 (0 to 4): 30 + 19 = 49
        self.assertEqual(st.query_range(0, 4), 49)

        # Update day 2 (index 1) from 10 to 20
        st.update_point(1, 20)
        # Sum days 1-4 is now 5 + 20 + 7 + 8 = 40
        self.assertEqual(st.query_range(0, 3), 40)


if __name__ == '__main__':
    unittest.main()
