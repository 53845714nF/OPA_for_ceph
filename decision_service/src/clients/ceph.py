from requests import get, post
from urllib3 import disable_warnings

disable_warnings()

class CephClient:
    def __init__(self, api_url, username, password):
        self.api_url = api_url
        self.username = username
        self.password = password
        self.jwt_token = None
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/vnd.ceph.api.v1.0+json",
        }

    def login(self):
        try:
            payload = {
                "username": self.username,
                "password": self.password
            }
            auth_url = f"{self.api_url}/auth"
            response = post(auth_url, json=payload, headers=self.headers, verify=False, timeout=5)
            if response.status_code in [200, 201]:
                self.jwt_token = response.json().get("token")
                if self.jwt_token:
                    self.headers["Authorization"] = f"Bearer {self.jwt_token}"
                    return True
            print(f"Ceph Login failed (Status {response.status_code}): {response.text}")
            return False
        except Exception as e:
            print(f"Ceph Login exception: {e}")
            return False

    def create_pool(self, pool_name: str, pg_num: int, pool_type: str, application_metadata: list[str]):
        if pool_type not in ["replicated", "erasure"]:
            raise ValueError("Invalid pool type")

        if not self.jwt_token:
            if not self.login():
                 raise Exception("Ceph login failed")

        self.headers["Authorization"] = f"Bearer {self.jwt_token}"
        
        payload = {
            "pool": pool_name,
            "pg_num": pg_num,
            "pool_type": pool_type,
            "application_metadata": application_metadata
        }
        
        response = post(f"{self.api_url}/pool", json=payload, headers=self.headers, verify=False)
        
        return response

    def get_storage_stats(self):
        if not self.jwt_token:
            if not self.login():
                return "Offline (Ceph API)"

        self.headers["Authorization"] = f"Bearer {self.jwt_token}"
        
        try:
            # Use /health/minimal which is known to exist
            response = get(f"{self.api_url}/health/minimal", headers=self.headers, verify=False, timeout=5)
            if response.status_code == 200:
                data = response.json()
                
                # Digging for total_bytes in the health/minimal response
                # Based on microceph ceph df output: stats -> total_bytes
                df_data = data.get("df", {})
                stats = df_data.get("stats", {})
                bytes_value = stats.get("total_bytes", 0)
                
                # Fallback paths
                if bytes_value == 0:
                    bytes_value = data.get("stats", {}).get("total_bytes", 0)
                
                if bytes_value > 0:
                    val = float(bytes_value)
                    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
                        if val < 1024:
                            return f"{val:.2f} {unit}"
                        val /= 1024
                    return f"{val:.2f} PB"
                
                return "0.00 B (Empty)"
                
        except Exception as e:
            print(f"Ceph Stats Error: {e}")
        
        return "N/A"

    def get_topology(self):
        """
        Dynamically discovers all multisite zones and endpoints from the Ceph cluster.
        """
        if not self.jwt_token and not self.login():
            return None

        self.headers["Authorization"] = f"Bearer {self.jwt_token}"
        try:
            # 1. Get zonegroups
            zg_res = get(f"{self.api_url}/rgw/zonegroup", headers=self.headers, verify=False, timeout=5)
            if zg_res.status_code != 200:
                return None
            
            zg_data = zg_res.json()
            zonegroups = zg_data.get("zonegroups", [])
            if not zonegroups:
                return None

            primary_zg_name = zonegroups[0]
            # 2. Get details of the zonegroup
            details_res = get(f"{self.api_url}/rgw/zonegroup/{primary_zg_name}", headers=self.headers, verify=False, timeout=5)
            if details_res.status_code != 200:
                return None

            details = details_res.json()
            zones_map = {}
            for z in details.get("zones", []):
                z_name = z.get("name")
                endpoints = z.get("endpoints", [])
                if z_name and endpoints:
                    zones_map[z_name] = {
                        "endpoint": endpoints[0],
                        "endpoints": endpoints,
                        "is_master": z.get("id") == details.get("master_zone"),
                    }
            return {
                "zonegroup": primary_zg_name,
                "master_zone": details.get("master_zone"),
                "sync_policy": details.get("sync_policy", {}),
                "zones": zones_map
            }
        except Exception as e:
            print(f"Ceph Topology Discovery Error: {e}")
            return None

    def get_bucket(self, bucket_name: str):
        if not self.jwt_token and not self.login():
            return None

        self.headers["Authorization"] = f"Bearer {self.jwt_token}"
        try:
            res = get(f"{self.api_url}/rgw/bucket/{bucket_name}", headers=self.headers, verify=False, timeout=5)
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            print(f"Ceph get_bucket Error: {e}")
        return None

    def list_buckets(self):
        if not self.jwt_token and not self.login():
            return []

        self.headers["Authorization"] = f"Bearer {self.jwt_token}"
        try:
            res = get(f"{self.api_url}/rgw/bucket", headers=self.headers, verify=False, timeout=5)
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            print(f"Ceph list_buckets Error: {e}")
        return []
