# Ceph Manager `decision_notifier` Module

This is a custom Ceph Manager module.
Designed to act as a "Rückkanal" (Return Channel) between the Ceph cluster and the `decision_service`.

## How to Install

Use the GitHub Container Registry to deploy the module.

```bash
cephadm shell -- ceph orch upgrade start --image ghcr.io/53845714nf/opa_for_ceph/ceph-v18-mgr-ds:latest

watch "cephadm shell -- ceph orch upgrade status"

cephadm shell -- ceph orch ps

```

Set Decision Service URL

```bash
cephadm shell -- ceph decision_notifier set_url http://[IP_ADDRESS]:[PORT]/ceph-events
```


## Redeploy mgr

To redeploy mgr, use the following commands:

```bash
podman pull ghcr.io/53845714nf/opa_for_ceph/ceph-v18-mgr-ds:latest

cephadm shell -- ceph orch upgrade start --image ghcr.io/53845714nf/opa_for_ceph/ceph-v18-mgr-ds:latest

watch "cephadm shell -- ceph orch upgrade status"
```



## How to test

```bash
cephadm logs --name mgr.ceph1.gxircq | grep -i "decision_notifier"

# Warnung auslösen
cephadm shell -- ceph osd set noout

# Warnung wieder entfernen
cephadm shell -- ceph osd unset noout

```


## How it Works

1. Ceph's internal system triggers events. In this module is `osd_map` used.
2. The `notify` method in `module.py` catches these events.
3. The module fires a non-blocking HTTP POST request containing a JSON payload to the `decision_service`.
4. `decision_service` receives the event on the `/ceph-events` route and can trigger OPA checks.
