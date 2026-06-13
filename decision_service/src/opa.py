from requests import post


class OPAClient:
    def __init__(self, api_url):
        self.api_url = api_url
        
    
    def get_decision(self, tenant: str, workload: str ) -> dict:
        payload = {
            "input": {
                "tenant": tenant,
                "workload": workload
            }
        }

        response = post(f"{self.api_url}/v1/data/ceph/policy/decision", json=payload)
        return response.json()

    def validate_data_management(self, category: str, applied_policies: list, author: str = None) -> dict:
        payload = {
            "input": {
                "category": category,
                "applied_policies": applied_policies,
                "author": author
            }
        }

        response = post(f"{self.api_url}/v1/data/data_management", json=payload)
        return response.json()

