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

    def validate_deletion(self, role: str = "user", bucket: str = None, key: str = None) -> dict:
        payload = {
            "input": {
                "action": "delete",
                "role": role,
                "bucket": bucket,
                "key": key
            }
        }
        try:
            response = post(f"{self.api_url}/v1/data/data_management", json=payload, timeout=5)
            return response.json()
        except Exception as e:
            print(f"OPA validate_deletion error: {e}")
            return {
                "result": {
                    "allow": role == "admin",
                    "violations": [] if role == "admin" else [
                        f"User mit der Rolle '{role}' ist nicht zum Löschen berechtigt. Nur Administratoren dürfen Daten löschen."
                    ]
                }
            }

    def validate_modification(
        self,
        role: str = "user",
        bucket: str = None,
        old_key: str = None,
        new_key: str = None,
        target_bucket: str = None,
        promote_to_master: bool = False,
        action: str = "modify"
    ) -> dict:
        payload = {
            "input": {
                "action": action,
                "role": role,
                "bucket": bucket,
                "old_key": old_key,
                "new_key": new_key,
                "target_bucket": target_bucket,
                "promote_to_master": promote_to_master
            }
        }
        try:
            response = post(f"{self.api_url}/v1/data/data_management", json=payload, timeout=5)
            return response.json()
        except Exception as e:
            print(f"OPA validate_modification error: {e}")
            allowed = role in ["admin", "curator"]
            violations = []
            if not allowed:
                violations.append(
                    f"User mit der Rolle '{role}' ist nicht zum Bearbeiten oder Erheben von Daten berechtigt. Nur Administratoren und Kuratoren dürfen Daten bearbeiten und zu curated_master erheben."
                )
            if (action == "promote" or promote_to_master or target_bucket in ["curated-master", "curated_master"]) and bucket not in ["raw-primary", "raw_primary"]:
                violations.append(
                    f"Nur Rohdaten ('raw-primary') können zu 'curated_master' erhoben werden. Das Bucket '{bucket}' ist dafür nicht zulässig."
                )
            return {
                "result": {
                    "allow": allowed and len(violations) == 0,
                    "allow_modify": allowed,
                    "allow_promote": allowed and len(violations) == 0,
                    "violations": violations
                }
            }


