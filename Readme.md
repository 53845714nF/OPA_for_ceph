# Souveränitätsbewusste, richtlinienbasierte Speicherverteilung für das digitale kulturelle Erbe

Datensouveränität im digitalen kulturellen Erbe: Ein Policy-basierter Ansatz zur Speicherverteilung

## Ziel

Open Policy Agent entscheidet:

- welche Site (Ägypten / Irak)
- ob Nutzer die Daten erstellen darf
- ob Nutzer die Daten verändern darf
- welche Replikation oder Erasure Coding Policy

Ergebnis: OPA ist „Policy Compiler“, Ceph ist „Execution Engine“

## Setup

### Ceph Multi-Site Setup

Erstelle ein Multi-Site Setup mit 2 Sites (Ägypten und Irak)

```bash
cd ceph
./install-microceph.sh
```

### Policy Layer (OPA)

```bash
cd opa
docker compose up -d
```

### Decision Layer (Service)

```bash
cd decision_service
source .venv/bin/activate
fastapi dev src/main.py
```


### Frontend

React Webseite um einfache Uploads zu ermöglichen:

```bash
cd frontend
bun run dev
```
