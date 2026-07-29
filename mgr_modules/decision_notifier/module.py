import json
import urllib.request
import urllib.error

# Ceph MgrModule base class is provided internally by Ceph Manager
try:
    from mgr_module import MgrModule, NotifyType
except ImportError:
    # Dummy mock for local development/syntax checking when not running inside Ceph
    class MgrModule:
        def __init__(self, *args, **kwargs):
            self.log = type('LogMock', (object,), {'info': print, 'error': print})()
    
    class NotifyType:
        osd_map = "osd_map"
        mon_map = "mon_map"
        pg_summary = "pg_summary"
        health = "health"
            
class Module(MgrModule):
    """
    Ceph Manager module to notify the decision_service about cluster events.
    """
    
    # Required by newer Ceph versions to register for events
    NOTIFY_TYPES = [
        NotifyType.osd_map,
        NotifyType.mon_map,
        NotifyType.pg_summary,
        NotifyType.health
    ]
    
    # These map Ceph notify_types to internal module flags
    COMMANDS = [
        {"cmd": "decision_notifier set_url name=url,type=CephString",
         "desc": "Set the webhook URL for the decision_service",
         "perm": "rw"}
    ]

    def __init__(self, *args, **kwargs):
        super(Module, self).__init__(*args, **kwargs)
        # Default URL (can be updated via command: ceph decision_notifier set_url http://...)
        self.decision_service_url = "http://192.168.178.110:8000/ceph-events"

    def handle_command(self, inbuf, cmd):
        if cmd['prefix'] == 'decision_notifier set_url':
            self.decision_service_url = cmd.get('url', self.decision_service_url)
            self.log.info(f"Updated decision_service URL to {self.decision_service_url}")
            return 0, "", f"URL set to {self.decision_service_url}"
        return -1, "Command not found", ""

    def notify(self, notify_type, notify_id):
        """
        Called by Ceph manager when a cluster event occurs.
        Types can include: osd_map, mon_map, pg_summary, health, etc.
        """
        self.log.info(f"Received notify event: type={notify_type}, id={notify_id}")
        
        event_data = {
            "type": notify_type,
            "id": notify_id,
            "message": f"Ceph event: {notify_type} updated."
        }
        
        # We spawn a simple background request to avoid blocking the manager thread
        try:
            self._send_to_decision_service(event_data)
        except Exception as e:
            self.log.error(f"Failed to handle notification for {notify_type}: {e}")

    def _send_to_decision_service(self, payload):
        try:
            req = urllib.request.Request(self.decision_service_url)
            req.add_header('Content-Type', 'application/json; charset=utf-8')
            jsondata = json.dumps(payload).encode('utf-8')
            
            # Very short timeout to ensure Ceph Manager doesn't get blocked
            response = urllib.request.urlopen(req, jsondata, timeout=2)
            self.log.info(f"Successfully notified decision_service. HTTP {response.getcode()}")
        except urllib.error.URLError as e:
            self.log.error(f"Connection failed to decision_service ({self.decision_service_url}): {e.reason}")
        except Exception as e:
            self.log.error(f"Unexpected error sending to decision_service: {e}")
