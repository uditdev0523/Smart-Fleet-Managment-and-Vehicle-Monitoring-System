"""
FleetOps - Smart Fleet Management and Vehicle Monitoring System
Data Structures and Algorithms II (CCSE0301) Core Library
Author: Udit Pratap Singh (Roll No. 2501330100392)
SDG 9: Industry, Innovation & Infrastructure

Modules Implemented:
1. Unit 1: BST, AVL Tree, MaintenanceMaxHeap
2. Unit 2: Graph (Adjacency List), BFS, DFS, Connected Components,
          Dijkstra, Bellman-Ford, Floyd-Warshall, Prim MST, Kruskal MST
3. Unit 3: 0/1 Knapsack, Longest Common Subsequence (LCS), Workshop Hours Allocation
4. Unit 4: Backtracking Exact Load Subset, Branch & Bound Delivery Tour (TSP)
5. Unit 5: Disjoint Set Union (DSU), Registration Trie, Fuel Segment Tree
"""

from collections import deque
import heapq
import math


# =====================================================================
# UNIT 1: TREES AND HEAPS
# =====================================================================

class BSTNode:
    def __init__(self, key, value=None):
        self.key = key
        self.value = value
        self.left = None
        self.right = None


class VehicleBST:
    """Binary Search Tree for Vehicle ID lookup and sorted in-order traversal."""
    def __init__(self):
        self.root = None

    def insert(self, key, value=None):
        def _insert(node, k, v):
            if node is None:
                return BSTNode(k, v)
            if k < node.key:
                node.left = _insert(node.left, k, v)
            elif k > node.key:
                node.right = _insert(node.right, k, v)
            else:
                node.value = v
            return node

        self.root = _insert(self.root, key, value)

    def search(self, key):
        curr = self.root
        while curr:
            if key == curr.key:
                return curr.value
            elif key < curr.key:
                curr = curr.left
            else:
                curr = curr.right
        return None

    def in_order_keys(self):
        result = []
        def _traverse(node):
            if not node:
                return
            _traverse(node.left)
            result.append(node.key)
            _traverse(node.right)
        _traverse(self.root)
        return result


class AVLNode:
    def __init__(self, key, value=None):
        self.key = key
        self.value = value
        self.height = 1
        self.left = None
        self.right = None


class VehicleAVLTree:
    """Self-balancing AVL Tree guaranteeing O(log n) worst-case search and insert."""
    def __init__(self):
        self.root = None

    def _height(self, node):
        return node.height if node else 0

    def _balance_factor(self, node):
        return self._height(node.left) - self._height(node.right) if node else 0

    def _rotate_right(self, y):
        x = y.left
        T2 = x.right
        x.right = y
        y.left = T2
        y.height = max(self._height(y.left), self._height(y.right)) + 1
        x.height = max(self._height(x.left), self._height(x.right)) + 1
        return x

    def _rotate_left(self, x):
        y = x.right
        T2 = y.left
        y.left = x
        x.right = T2
        x.height = max(self._height(x.left), self._height(x.right)) + 1
        y.height = max(self._height(y.left), self._height(y.right)) + 1
        return y

    def insert(self, key, value=None):
        def _insert(node, k, v):
            if not node:
                return AVLNode(k, v)
            if k < node.key:
                node.left = _insert(node.left, k, v)
            elif k > node.key:
                node.right = _insert(node.right, k, v)
            else:
                node.value = v
                return node

            node.height = 1 + max(self._height(node.left), self._height(node.right))
            balance = self._balance_factor(node)

            # Left Left
            if balance > 1 and k < node.left.key:
                return self._rotate_right(node)
            # Right Right
            if balance < -1 and k > node.right.key:
                return self._rotate_left(node)
            # Left Right
            if balance > 1 and k > node.left.key:
                node.left = self._rotate_left(node.left)
                return self._rotate_right(node)
            # Right Left
            if balance < -1 and k < node.right.key:
                node.right = self._rotate_right(node.right)
                return self._rotate_left(node)

            return node

        self.root = _insert(self.root, key, value)

    def search(self, key):
        curr = self.root
        while curr:
            if key == curr.key:
                return curr.value
            elif key < curr.key:
                curr = curr.left
            else:
                curr = curr.right
        return None

    def get_height(self):
        return self._height(self.root)

    def in_order_keys(self):
        res = []
        def _inorder(node):
            if not node:
                return
            _inorder(node.left)
            res.append(node.key)
            _inorder(node.right)
        _inorder(self.root)
        return res


class MaintenanceMaxHeap:
    """Max-Heap priority queue for urgent vehicle maintenance tasks.
    Higher urgency score = higher servicing priority.
    """
    def __init__(self):
        # We store (-urgency, counter, vehicle_id, task_details)
        self._heap = []
        self._counter = 0

    def push(self, urgency, vehicle_id, details=None):
        # Python heapq is a min-heap; invert urgency to make it max-heap
        heapq.heappush(self._heap, (-urgency, self._counter, vehicle_id, details))
        self._counter += 1

    def pop(self):
        if not self._heap:
            return None
        neg_urgency, _, vehicle_id, details = heapq.heappop(self._heap)
        return (-neg_urgency, vehicle_id)

    def peek(self):
        if not self._heap:
            return None
        neg_urgency, _, vehicle_id, details = self._heap[0]
        return (-neg_urgency, vehicle_id)

    def is_empty(self):
        return len(self._heap) == 0

    def __len__(self):
        return len(self._heap)


# =====================================================================
# UNIT 2: GRAPHS AND ROUTE OPTIMIZATION
# =====================================================================

class Graph:
    """Adjacency-list weighted graph representation for depots and route corridors."""
    def __init__(self):
        self.adj = {}

    def add_vertex(self, u):
        if u not in self.adj:
            self.adj[u] = []

    def add_edge(self, u, v, weight, bidirectional=True):
        self.add_vertex(u)
        self.add_vertex(v)
        self.adj[u].append((v, weight))
        if bidirectional:
            self.adj[v].append((u, weight))

    def vertices(self):
        return list(self.adj.keys())

    def get_edges(self):
        edges = []
        seen = set()
        for u in self.adj:
            for v, w in self.adj[u]:
                edge_id = tuple(sorted([u, v]))
                if edge_id not in seen:
                    seen.add(edge_id)
                    edges.append((u, v, w))
        return edges


def bfs_hops(graph: Graph, start):
    """Returns minimum-hop count from start depot to all reachable depots."""
    if start not in graph.adj:
        return {}
    hops = {start: 0}
    q = deque([start])
    while q:
        u = q.popleft()
        for v, _ in graph.adj[u]:
            if v not in hops:
                hops[v] = hops[u] + 1
                q.append(v)
    return hops


def dfs_order(graph: Graph, start):
    """Returns nodes in DFS traversal order."""
    if start not in graph.adj:
        return []
    visited = set()
    order = []

    def _dfs(u):
        visited.add(u)
        order.append(u)
        for v, _ in graph.adj[u]:
            if v not in visited:
                _dfs(v)

    _dfs(start)
    return order


def connected_components(graph: Graph):
    """Finds all isolated depot clusters in the network."""
    visited = set()
    components = []
    for node in sorted(graph.adj.keys()):
        if node not in visited:
            comp = []
            q = deque([node])
            visited.add(node)
            while q:
                u = q.popleft()
                comp.append(u)
                for v, _ in graph.adj[u]:
                    if v not in visited:
                        visited.add(v)
                        q.append(v)
            components.append(sorted(comp))
    return components


def dijkstra(graph: Graph, start, target=None):
    """Finds minimum-distance path using non-negative edge weights."""
    if start not in graph.adj:
        return ({}, {}) if target is None else (float('inf'), [])
    dist = {v: float('inf') for v in graph.adj}
    prev = {v: None for v in graph.adj}
    dist[start] = 0
    pq = [(0, start)]

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        if target is not None and u == target:
            break
        for v, w in graph.adj[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                prev[v] = u
                heapq.heappush(pq, (dist[v], v))

    if target is not None:
        if dist[target] == float('inf'):
            return (float('inf'), [])
        path = []
        curr = target
        while curr is not None:
            path.append(curr)
            curr = prev[curr]
        path.reverse()
        return (dist[target], path)

    return dist, prev


def bellman_ford(graph: Graph, start):
    """Single-source shortest path supporting negative edge weights and cycle detection."""
    nodes = list(graph.adj.keys())
    dist = {u: float('inf') for u in nodes}
    dist[start] = 0
    edges = []
    for u in graph.adj:
        for v, w in graph.adj[u]:
            edges.append((u, v, w))

    # Relax V - 1 times
    for _ in range(len(nodes) - 1):
        for u, v, w in edges:
            if dist[u] != float('inf') and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # Check for negative-weight cycles
    for u, v, w in edges:
        if dist[u] != float('inf') and dist[u] + w < dist[v]:
            raise ValueError("Graph contains a negative-weight cycle")

    return dist


def floyd_warshall(graph: Graph):
    """All-pairs shortest path matrix across all depots."""
    nodes = sorted(graph.adj.keys())
    dist = {u: {v: float('inf') for v in nodes} for u in nodes}

    for u in nodes:
        dist[u][u] = 0
        for v, w in graph.adj[u]:
            dist[u][v] = min(dist[u][v], w)

    for k in nodes:
        for i in nodes:
            for j in nodes:
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]

    return dist


def prim_mst(graph: Graph, start):
    """Computes Minimum Spanning Tree from a given start node.
    Returns (total_distance, edge_list).
    """
    if start not in graph.adj:
        return 0, []
    visited = {start}
    edges_pq = []
    for v, w in graph.adj[start]:
        heapq.heappush(edges_pq, (w, start, v))

    mst_edges = []
    total_cost = 0

    while edges_pq and len(visited) < len(graph.adj):
        w, u, v = heapq.heappop(edges_pq)
        if v in visited:
            continue
        visited.add(v)
        mst_edges.append((u, v, w))
        total_cost += w
        for next_v, next_w in graph.adj[v]:
            if next_v not in visited:
                heapq.heappush(edges_pq, (next_w, v, next_v))

    return total_cost, mst_edges


def kruskal_mst(graph: Graph):
    """Computes Minimum Spanning Forest using Disjoint Set Union (DSU).
    Returns (total_distance, edge_list).
    """
    dsu = DisjointSet(graph.vertices())
    edges = graph.get_edges()
    # Sort edges by weight
    edges.sort(key=lambda x: x[2])

    mst_edges = []
    total_cost = 0

    for u, v, w in edges:
        if dsu.find(u) != dsu.find(v):
            dsu.union(u, v)
            mst_edges.append((u, v, w))
            total_cost += w

    return total_cost, mst_edges


# =====================================================================
# UNIT 3: DYNAMIC PROGRAMMING
# =====================================================================

def knapsack_01(capacity, weights, values):
    """0/1 Knapsack for cargo parcel packing or workshop scheduling.
    Returns (max_value, chosen_indices_0_indexed).
    """
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        w = weights[i - 1]
        v = values[i - 1]
        for c in range(capacity + 1):
            if w <= c:
                dp[i][c] = max(dp[i - 1][c], dp[i - 1][c - w] + v)
            else:
                dp[i][c] = dp[i - 1][c]

    max_value = dp[n][capacity]

    # Reconstruct items
    chosen = []
    c = capacity
    for i in range(n, 0, -1):
        if dp[i][c] != dp[i - 1][c]:
            chosen.append(i - 1)
            c -= weights[i - 1]

    chosen.reverse()
    return max_value, chosen


def lcs(seq1, seq2):
    """Longest Common Subsequence of route stops.
    Returns (length, lcs_elements).
    """
    m, n = len(seq1), len(seq2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if seq1[i - 1] == seq2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    # Reconstruct
    lcs_res = []
    i, j = m, n
    while i > 0 and j > 0:
        if seq1[i - 1] == seq2[j - 1]:
            lcs_res.append(seq1[i - 1])
            i -= 1
            j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1
        else:
            j -= 1

    lcs_res.reverse()
    return dp[m][n], lcs_res


def allocate_workshop_hours(available_hours, job_hours, job_priorities):
    """Allocates limited workshop hours to maximize total priority of completed jobs."""
    return knapsack_01(available_hours, job_hours, job_priorities)


# =====================================================================
# UNIT 4: BACKTRACKING AND BRANCH & BOUND
# =====================================================================

def find_exact_load_subset(target_weight, parcel_weights):
    """Backtracking algorithm to find a subset of parcels matching an exact payload target.
    Returns list of parcel indices or None if impossible.
    """
    n = len(parcel_weights)
    result = []

    def _backtrack(idx, current_sum, current_indices):
        nonlocal result
        if current_sum == target_weight:
            result = list(current_indices)
            return True
        if idx >= n or current_sum > target_weight:
            return False

        # Try including parcel[idx]
        current_indices.append(idx)
        if _backtrack(idx + 1, current_sum + parcel_weights[idx], current_indices):
            return True
        current_indices.pop()

        # Try skipping parcel[idx]
        if _backtrack(idx + 1, current_sum, current_indices):
            return True

        return False

    if _backtrack(0, 0, []):
        return result
    return None


def delivery_tour_branch_and_bound(dist_matrix):
    """Branch and Bound Travelling Salesperson (TSP) for multi-stop delivery routes.
    Finds minimum-cost closed tour starting and ending at depot 0.
    Returns (min_cost, tour_indices).
    """
    n = len(dist_matrix)
    if n <= 1:
        return 0, [0, 0]

    best_cost = float('inf')
    best_tour = []

    # Precalculate minimum outgoing edge for lower bounding
    min_outgoing = []
    for i in range(n):
        row_min = min(dist_matrix[i][j] for j in range(n) if i != j)
        min_outgoing.append(row_min)

    def _bound(current_cost, visited_mask, last_node):
        b = current_cost
        for i in range(n):
            if not (visited_mask & (1 << i)):
                b += min_outgoing[i]
        return b

    def _search(curr, count, cost, visited_mask, path):
        nonlocal best_cost, best_tour
        if count == n:
            return_cost = dist_matrix[curr][0]
            total = cost + return_cost
            if total < best_cost:
                best_cost = total
                best_tour = path + [0]
            return

        # Prune using lower bound
        if _bound(cost, visited_mask, curr) >= best_cost:
            return

        for next_node in range(n):
            if not (visited_mask & (1 << next_node)):
                edge_cost = dist_matrix[curr][next_node]
                if cost + edge_cost < best_cost:
                    _search(
                        next_node,
                        count + 1,
                        cost + edge_cost,
                        visited_mask | (1 << next_node),
                        path + [next_node]
                    )

    _search(0, 1, 0, 1 << 0, [0])
    return best_cost, best_tour


# =====================================================================
# UNIT 5: ADVANCED DATA STRUCTURES
# =====================================================================

class DisjointSet:
    """Disjoint Set Union (Union-Find) with path compression and union by rank."""
    def __init__(self, elements):
        self.parent = {x: x for x in elements}
        self.rank = {x: 0 for x in elements}

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        rx = self.find(x)
        ry = self.find(y)
        if rx == ry:
            return False
        if self.rank[rx] < self.rank[ry]:
            self.parent[rx] = ry
        elif self.rank[rx] > self.rank[ry]:
            self.parent[ry] = rx
        else:
            self.parent[ry] = rx
            self.rank[rx] += 1
        return True

    def connected(self, x, y):
        return self.find(x) == self.find(y)


class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_terminal = False
        self.payload = None


class RegistrationTrie:
    """Trie structure for fast registration number prefix searches and autocompletion."""
    def __init__(self):
        self.root = TrieNode()

    def insert(self, reg_no, payload=None):
        curr = self.root
        for ch in reg_no.upper():
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_terminal = True
        curr.payload = payload

    def search_exact(self, reg_no):
        curr = self.root
        for ch in reg_no.upper():
            if ch not in curr.children:
                return False, None
            curr = curr.children[ch]
        return curr.is_terminal, curr.payload

    def starts_with(self, prefix):
        curr = self.root
        for ch in prefix.upper():
            if ch not in curr.children:
                return []
            curr = curr.children[ch]

        results = []
        def _collect(node, current_str):
            if node.is_terminal:
                results.append(current_str)
            for ch in sorted(node.children.keys()):
                _collect(node.children[ch], current_str + ch)

        _collect(curr, prefix.upper())
        return results


class FuelSegmentTree:
    """Segment Tree for O(log n) range queries and point updates of daily fuel consumption."""
    def __init__(self, fuel_data):
        self.n = len(fuel_data)
        self.tree = [0] * (4 * max(self.n, 1))
        if self.n > 0:
            self._build(fuel_data, 1, 0, self.n - 1)

    def _build(self, data, node, start, end):
        if start == end:
            self.tree[node] = data[start]
            return
        mid = (start + end) // 2
        self._build(data, 2 * node, start, mid)
        self._build(data, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query_range(self, l, r):
        """Query sum in 0-indexed range [l, r] inclusive."""
        def _query(node, start, end, ql, qr):
            if qr < start or end < ql:
                return 0
            if ql <= start and end <= qr:
                return self.tree[node]
            mid = (start + end) // 2
            p1 = _query(2 * node, start, mid, ql, qr)
            p2 = _query(2 * node + 1, mid + 1, end, ql, qr)
            return p1 + p2

        if self.n == 0 or l > r or l >= self.n or r < 0:
            return 0
        l = max(0, l)
        r = min(self.n - 1, r)
        return _query(1, 0, self.n - 1, l, r)

    def update_point(self, index, new_value):
        """Update fuel reading at day index (0-indexed)."""
        def _update(node, start, end, idx, val):
            if start == end:
                self.tree[node] = val
                return
            mid = (start + end) // 2
            if idx <= mid:
                _update(2 * node, start, mid, idx, val)
            else:
                _update(2 * node + 1, mid + 1, end, idx, val)
            self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

        if 0 <= index < self.n:
            _update(1, 0, self.n - 1, index, new_value)
