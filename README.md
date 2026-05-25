# votacion-minero

Nodo minero para sistema de votación distribuida con:
- API HTTP (mempool, minado por slot, consulta de bloques).
- Consenso entre nodos (`propose -> prevote -> precommit -> commit`).
- Sincronización por altura (`/height`, `/blocks-from`).
- Persistencia en PostgreSQL.

## Requisitos
- Docker + Docker Compose
- O Node.js 20+ y PostgreSQL 16+

## Ejecutar (single node)
```bash
docker compose up -d --build
```

API local:
- `http://localhost:3001/health`

## Ejecutar cluster (3 nodos)
```bash
docker compose -f docker-compose.cluster.yml up -d --build
```

Puertos:
- `minero1`: `3011`
- `minero2`: `3012`
- `minero3`: `3013`

## Variables de entorno
Ver `.env.example`:
- DB: `HOSTDB`, `PORTDB`, `NAMEDB`, `USERDB`, `PASSDB`
- API auth: `USER_API`, `PASS_API`
- Consenso: `NODE_ID`, `NODE_LIST`, `SLOT_SECONDS`, `NODE_SECRET`, `QUORUM_MIN`
- Red P2P: `P2P_PORT`, `PEERS`

## Endpoints principales
- `GET /health`
- `POST /tx`
- `POST /mine-slot`
- `POST /blocks`
- `POST /block`
- `POST /height`
- `POST /blocks-from`
- `POST /acks`

Especificación completa:
- `docs/openapi.yml`

## Apagado y limpieza
```bash
docker compose down -v --remove-orphans
docker compose -f docker-compose.cluster.yml down -v --remove-orphans
```
