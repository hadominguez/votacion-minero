# Spec: Operación con Docker

## Servicios
- `minero`: API HTTP + nodo P2P.
- `mongo`: persistencia blockchain.

## Levantar entorno
Desde raíz del repo:
```bash
docker compose up -d --build
```

## Verificar estado
```bash
docker compose ps
curl http://localhost:3001/health
```

## Logs
```bash
docker compose logs -f minero
docker compose logs -f mongo
```

## Bajar entorno
```bash
docker compose down
```

## Reset completo (incluye datos)
```bash
docker compose down -v
```
