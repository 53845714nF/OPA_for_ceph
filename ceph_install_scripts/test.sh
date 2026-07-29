#!/bin/bash

echo "=== Teste RGW Ägypten (Master) auf Port 80 ==="
# Wir erwarten ein S3 XML-Format als Antwort
if curl -s http://localhost:80 | grep -q "ListAllMyBucketsResult"; then
    echo "✅ RGW Ägypten ist erreichbar und antwortet als S3 Gateway!"
else
    echo "❌ RGW Ägypten antwortet nicht wie erwartet. (Läuft der Dienst?)"
fi

echo ""
echo "=== Teste RGW Irak (Replica) auf Port 8001 ==="
if curl -s http://localhost:8001 | grep -q "ListAllMyBucketsResult"; then
    echo "✅ RGW Irak ist erreichbar und antwortet als S3 Gateway!"
else
    echo "❌ RGW Irak antwortet nicht wie erwartet. (Läuft der Dienst?)"
fi

echo ""
echo "=== Weiterführender S3 Test (Erfordert AWS CLI) ==="
if command -v aws &> /dev/null; then
    export AWS_ACCESS_KEY_ID=test
    export AWS_SECRET_ACCESS_KEY=test
    
    echo "Erstelle Bucket 'test-bucket' auf RGW Ägypten..."
    aws --endpoint-url http://localhost:80 --region world s3 mb s3://test-bucket || true
    
    echo "Lade Buckets von RGW Ägypten:"
    aws --endpoint-url http://localhost:80 --region world s3 ls
    
    echo "Lade Buckets von RGW Irak (Synchronisation kann einen Moment dauern):"
    aws --endpoint-url http://localhost:8001 --region world s3 ls
    
else
    echo "AWS CLI ist nicht installiert. Um volle S3-Funktionalität (wie das Erstellen von Buckets und Replikation) zu testen, installiere es mit:"
    echo "sudo apt install awscli"
fi
