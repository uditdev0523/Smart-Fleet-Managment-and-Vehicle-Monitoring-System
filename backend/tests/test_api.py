"""
Comprehensive Backend Integration Tests
Tests authentication, CRUD endpoints, DSA routing, conflict validation, and Max-Heap priority.
"""
import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from database import init_db

client = TestClient(app)


class TestFleetOpsAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_root_and_health(self):
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("FleetOps", data["project"])
        self.assertEqual(data["gps_status"], "SIMULATED GPS DATA")

        health = client.get("/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json()["status"], "healthy")

    def test_02_auth_login(self):
        res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "fleet_manager")

    def test_03_vehicle_trie_and_tree_search(self):
        # Trie search
        trie_res = client.get("/api/vehicles/search/trie?prefix=UP32")
        self.assertEqual(trie_res.status_code, 200)
        trie_data = trie_res.json()
        self.assertIn("UP32AB1234", trie_data["matches"])
        self.assertIn("UP32AB5678", trie_data["matches"])

        # Tree search
        tree_res = client.get("/api/vehicles/search/tree?vehicle_id=1")
        self.assertEqual(tree_res.status_code, 200)
        tree_data = tree_res.json()
        self.assertIsNotNone(tree_data["bst_found"])
        self.assertIsNotNone(tree_data["avl_found"])

    def test_04_dsa_route_compare_bfs_vs_dijkstra(self):
        # D1 to D4 comparison on sample network
        res = client.get("/api/dsa/route-compare?origin=D1&destination=D4")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Dijkstra must find 8 km via 3 hops [D1, D3, D2, D4]
        self.assertEqual(data["dijkstra"]["total_distance_km"], 8.0)
        self.assertEqual(data["dijkstra"]["path"], ["D1", "D3", "D2", "D4"])
        self.assertEqual(data["dijkstra"]["hop_count"], 3)

        # BFS must find 2 hops (D1 -> D2 -> D4 = 9 km)
        self.assertEqual(data["bfs"]["hop_count"], 2)
        self.assertEqual(data["bfs"]["total_distance_km"], 9.0)

    def test_05_max_heap_priority_queue(self):
        res = client.get("/api/maintenance/max-heap-queue")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["queue_length"], 0)
        # Highest urgency must be first item popped from heap
        first_job = data["prioritized_jobs"][0]
        self.assertEqual(first_job["urgency_score"], 9)
        self.assertEqual(first_job["vehicle_code"], "V2")

    def test_06_fuel_segment_tree_range_query(self):
        res = client.get("/api/fuel/segment-tree-query?start_day=0&end_day=3")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_litres_in_range", data)
        self.assertGreater(data["total_litres_in_range"], 0)

    def test_07_kpi_summary_live(self):
        res = client.get("/api/reports/kpi-summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["total_vehicles"], 0)
        self.assertIn("estimated_emissions_kg_co2", data)
        self.assertIn("total_fuel_expenditure_inr", data)

    def test_08_trip_conflict_validation(self):
        # Attempt to create trip with cargo exceeding vehicle load capacity
        # Vehicle 1 has capacity 16000 kg. Let's send 50000 kg.
        res = client.post("/api/trips", json={
            "trip_code": "CONFLICT-001",
            "origin_depot_code": "D1",
            "destination_depot_code": "D2",
            "vehicle_id": 1,
            "driver_id": 2,
            "planned_departure": "2026-10-28T10:00:00",
            "expected_arrival": "2026-10-28T12:00:00",
            "cargo_description": "Excess Weight Test",
            "cargo_weight_kg": 50000.0,
            "distance_km": 4.0
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("exceeds vehicle payload capacity", res.json()["detail"])


if __name__ == "__main__":
    unittest.main()
