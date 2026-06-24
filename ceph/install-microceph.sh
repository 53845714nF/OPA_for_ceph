#!/bin/bash
set -e

echo "=== Bereinige altes MicroCeph (falls vorhanden) ==="
if snap list | grep -q microceph; then
    sudo snap remove --purge microceph
fi

echo "=== Installiere MicroCeph ==="
sudo snap install microceph --channel=reef/stable

echo "=== Initialisiere Ceph Cluster ==="
sudo /snap/bin/microceph cluster bootstrap

echo "=== Konfiguriere Speicher (3 Loop-Devices, je 4GB) ==="
sudo /snap/bin/microceph disk add loop,4G,3

echo "=== Aktiviere RGW (S3) ==="
sudo /snap/bin/microceph enable rgw

echo "=== Konfiguriere Multisite (Realm, Zonegroup, Zones) ==="
sudo /snap/bin/microceph.radosgw-admin realm create --rgw-realm=global --default
sudo /snap/bin/microceph.radosgw-admin zonegroup create --rgw-zonegroup=world --master --default --endpoints=http://localhost:80
sudo /snap/bin/microceph.radosgw-admin zone create --rgw-zonegroup=world --rgw-zone=ägypten --master --default --endpoints=http://localhost:80
sudo /snap/bin/microceph.radosgw-admin zone create --rgw-zonegroup=world --rgw-zone=irak --endpoints=http://localhost:8001

echo "=== Speichere Änderungen (Period Update) ==="
sudo /snap/bin/microceph.radosgw-admin period update --commit

echo "=== Erstelle S3 Test-User ==="
sudo /snap/bin/microceph.radosgw-admin user create --uid=testuser --display-name="Test User" --access-key=test --secret-key=test

echo "=== Berechtige und starte zweite RGW-Instanz (Zone: Irak) ==="
sudo /snap/bin/microceph.ceph auth get-or-create client.rgw.irak osd 'allow rwx' mon 'allow rw' -o /tmp/client.rgw.irak.keyring

# Starte den Haupt-Dienst neu für Zone Ägypten
sudo snap restart microceph.rgw

# Beende alte RGW-Instanz für Irak, falls vorhanden
sudo pkill -f "radosgw.*client.rgw.irak" || true

sudo snap run --shell microceph.rgw -c 'radosgw -c /var/snap/microceph/current/conf/ceph.conf -n client.rgw.irak -k /tmp/client.rgw.irak.keyring --rgw-zone=irak --rgw-frontends="beast port=8001"' &

echo "=== Aktiviere Ceph Dashboard (REST API für FastAPI) ==="
sudo /snap/bin/microceph.ceph config set mgr mgr/dashboard/ssl false
sudo /snap/bin/microceph.ceph config set mgr mgr/dashboard/server_port 8081
sudo /snap/bin/microceph.ceph mgr module enable dashboard
echo "ceph-password" | sudo /snap/bin/microceph.ceph dashboard ac-user-create admin administrator -i -

echo "=== Installation abgeschlossen! ==="
echo "RGW Ägypten (Master): http://localhost:80"
echo "RGW Irak (Replica): http://localhost:8001"
