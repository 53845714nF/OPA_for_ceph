package ceph.policy

import rego.v1

default allow := false

# Default values if no specific match
default pool_type := "replicated"
default device_class := "hdd"
default failure_domain := "host"
default pg_num := 32

# Policies based on Workload
pool_type := "erasure" if {
    input.workload == "logs"
}

device_class := "ssd" if {
    input.tenant == "Tenant A"
}

device_class := "nvme" if {
    input.workload == "ml-datasets"
}

failure_domain := "rack" if {
    input.tenant == "Tenant A"
}

# Final Decision object returned to the FastAPI service
decision := {
    "pool_type": pool_type,
    "device_class": device_class,
    "failure_domain": failure_domain,
    "pg_num": pg_num,
    # Provide additional config based on pool_type
    "erasure_profile": erasure_profile,
    "replicated_size": replicated_size
}

# Example erasure coding profile logic
default erasure_profile := null
erasure_profile := "ec-2-1" if {
    pool_type == "erasure"
}

# Example replication size logic
default replicated_size := 3
replicated_size := 2 if {
    input.tenant == "Tenant A"
}
