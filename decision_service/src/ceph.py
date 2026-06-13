from requests import post
import urllib3

urllib3.disable_warnings()

class CephClient:
    def __init__(self, api_url, username, password):
        self.api_url = api_url
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/vnd.ceph.api.v1.0+json",
        }
        self.login(username, password)

    def login(self, username, password):
        payload = {
            "username": username,
            "password": password
        }
        response = post(f"{self.api_url}/auth", json=payload, headers=self.headers, verify=False)
        print(response.text)
        self.jwt_token = response.json()["token"]
        self.headers["Authorization"] = f"Bearer {self.jwt_token}"
        return response.json()

    def create_pool(self, pool_name: str, pg_num: int, pool_type: str, application_metadata: list[str]):
        if pool_type not in ["replicated", "erasure"]:
            raise ValueError("Invalid pool type")

        self.headers["Authorization"] = f"Bearer {self.jwt_token}"
        
        payload = {
            "pool": pool_name,
            "pg_num": pg_num,
            "pool_type": pool_type,
            "application_metadata": application_metadata
        }
        
        response = post(f"{self.api_url}/pool", json=payload, headers=self.headers, verify=False)
        
        return response
