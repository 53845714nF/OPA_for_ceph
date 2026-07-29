#!/bin/bash

USER=root
HOSTS=("ceph1" "ceph2" "ceph3")

for HOST in "${HOSTS[@]}"; do
    echo "Deploying to $HOST..."

    scp -r ./decision_notifier "$USER@$HOST:/opt/"

    ssh "$USER@$HOST" '
        set -e

        CID=$(podman ps --filter "name=mgr" --format "{{.ID}}" | head -n1)

        if [ -n "$CID" ]; then
            podman cp /opt/decision_notifier "$CID":/usr/share/ceph/mgr/
            podman restart "$CID"
        else
            echo "Kein MGR-Container auf diesem Host gefunden."
        fi
    '
done

echo "Warte auf Neustart der MGR-Daemons..."
sleep 10

# Modul nur einmal aktivieren
ssh "$USER@${HOSTS[0]}" '
    cephadm shell -- ceph mgr module enable decision_notifier
'