from fastapi import APIRouter, Request

router = APIRouter(prefix="/ceph-events", tags=["Ceph Webhooks"])

@router.post("")
async def receive_ceph_event(request: Request):
    """
    Receives cluster events pushed by the Ceph Manager Module 'decision_notifier'.
    """
    try:
        data = await request.json()
        
        # Here we just log it for the POC. 
        # In a real scenario, you'd trigger OPA checks or database updates here.
        print(f"=====================================")
        print(f"📦 RECEIVED CEPH EVENT: {data.get('type')}")
        print(f"ID: {data.get('id')}")
        print(f"Message: {data.get('message')}")
        print(f"Full Payload: {data}")
        print(f"=====================================")
        
        return {"status": "success", "received_type": data.get("type")}
    except Exception as e:
        print(f"Error parsing Ceph event: {e}")
        return {"status": "error", "message": str(e)}
