#!/bin/bash
set -e

echo "=== Applying Multisite Credentials Fix In-Place ==="

# 1. Update/re-create testuser with --system flag
echo "Updating testuser to be a system user..."
sudo /snap/bin/microceph.radosgw-admin user create --uid=testuser --display-name="Test User" --access-key=test --secret-key=test --system

# 2. Modify zonegroup and zones with credentials
echo "Configuring credentials for zonegroup 'world'..."
sudo /snap/bin/microceph.radosgw-admin zonegroup modify --rgw-zonegroup=world --access-key=test --secret-key=test

echo "Configuring credentials for zone 'ägypten'..."
sudo /snap/bin/microceph.radosgw-admin zone modify --rgw-zonegroup=world --rgw-zone=ägypten --access-key=test --secret-key=test

echo "Configuring credentials for zone 'irak'..."
sudo /snap/bin/microceph.radosgw-admin zone modify --rgw-zonegroup=world --rgw-zone=irak --access-key=test --secret-key=test

# 3. Commit period
echo "Committing period changes..."
sudo /snap/bin/microceph.radosgw-admin period update --commit

# 4. Restart gateways to apply configurations
echo "Restarting primary RGW service (Egypt)..."
sudo snap restart microceph.rgw

echo "Restarting replica RGW instance (Iraq)..."
sudo pkill -f "radosgw.*client.rgw.irak" || true
sudo snap run --shell microceph.rgw -c 'radosgw -c /var/snap/microceph/current/conf/ceph.conf -n client.rgw.irak -k /tmp/client.rgw.irak.keyring --rgw-zone=irak --rgw-frontends="beast port=8001"' &

echo "=== Multisite Fix Applied Successfully! ==="
