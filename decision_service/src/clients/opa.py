from requests import post

class OPAClient:
    def __init__(self, api_url):
        self.api_url = api_url
        
    def get_decision(self, tenant: str, workload: str) -> dict:
        payload = {
            "input": {
                "tenant": tenant,
                "workload": workload
            }
        }

        response = post(f"{self.api_url}/v1/data/ceph/policy/decision", json=payload)
        return response.json()

    def validate_data_management(self, category: str, author: str = None, role: str = "user", applied_policies: list = None) -> dict:
        payload = {
            "input": {
                "category": category,
                "author": author,
                "role": role
            }
        }
        if applied_policies is not None:
            payload["input"]["applied_policies"] = applied_policies

        response = post(f"{self.api_url}/v1/data/data_management", json=payload)
        return response.json()
