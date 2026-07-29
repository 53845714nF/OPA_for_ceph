"""
This file is used to notify the decision_service about cluster events.
"""

from json import dumps
from urllib.request import Request, urlopen
from urllib.error import URLError

# Ceph MgrModule class is provided internally by Ceph Manager
try:
    from mgr_module import MgrModule, NotifyType
except ImportError:
    # Dummy mock for local development/syntax checking when not running inside Ceph
    class MgrModule:
        def __init__(self, *args, **kwargs):
            self.log = type('LogMock', (object,), {'info': print, 'error': print})()

    class NotifyType:
        osd_map = "osd_map"

class Module(MgrModule):
    """
    Ceph Manager module to notify the decision_service about cluster events.
    """
    COMMANDS = [
        {
        "cmd": "decision_notifier set_url name=url,type=CephString",
        "desc": "Set the webhook URL for the decision_service",
        "perm": "rw"
        }
    ]
    NOTIFY_TYPES = [NotifyType.osd_map]

    def __init__(self, *args, **kwargs):
        super(Module, self).__init__(*args, **kwargs)
        # Default URL (can be updated via command: ceph decision_notifier set_url http://...)
        self.decision_service_url = "http://192.168.178.110:8000/ceph-events"


    def notify(self, notify_type: NotifyType, notify_id):
        """
        Called by Ceph manager when a cluster event occurs.
        Types can include: osd_map, mon_map, pg_summary, health, etc.
        """
        self.log.info(f"Received notify event: type={notify_type}, id={notify_id}")

        # Filter nur nach 'osd_map' Events
        if notify_type != NotifyType.osd_map:
            return

        event_data = {
            "type": notify_type,
            "id": notify_id,
            "message": "Ceph OSD Map updated.",
            "pools": []
        }

        # Versuche, die aktuellen Pool-Konfigurationen aus Ceph auszulesen
        try:
            osd_map = self.get("osd_map")
            if osd_map and "pools" in osd_map:
                for pool in osd_map["pools"]:
                    event_data["pools"].append({
                        "pool_id": pool.get("pool"),
                        "pool_name": pool.get("pool_name"),
                        "size": pool.get("size"),            # Replica Count
                        "min_size": pool.get("min_size"),
                        "crush_rule": pool.get("crush_rule") # Datacenter/Location Rule
                    })
        except Exception as e:
            self.log.error(f"Failed to extract pool data: {e}")

        # We spawn a simple background request to avoid blocking the manager thread
        try:
            self._send_to_decision_service(event_data)
        except Exception as e:
            self.log.error(f"Failed to handle notification for {notify_type}: {e}")


    def handle_command(self, inbuf, cmd):
        """
        Handles commands sent to the decision_notifier module.
        Usage: ceph decision_notifier set_url <url>
        """
        if cmd['prefix'] == 'decision_notifier set_url':
            self.decision_service_url = cmd.get('url', self.decision_service_url)
            self.log.info(f"Updated decision_service URL to {self.decision_service_url}")
            return 0, "", f"URL set to {self.decision_service_url}"
        return -1, "Command not found", ""


    def _send_to_decision_service(self, payload):
        try:
            req = Request(self.decision_service_url)
            req.add_header('Content-Type', 'application/json; charset=utf-8')
            jsondata = dumps(payload).encode('utf-8')

            # Very short timeout to ensure Ceph Manager doesn't get blocked
            with urlopen(req, jsondata, timeout=2) as response:
                self.log.info(f"Successfully notified decision_service. HTTP {response.getcode()}")
        except URLError as e:
            self.log.error(f"Connection failed to decision_service "
                           f"({self.decision_service_url}): {e.reason}")
        except Exception as e:
            self.log.error(f"Unexpected error sending to decision_service: {e}")
