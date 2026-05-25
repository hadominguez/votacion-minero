# Spec: API HTTP actualizada

## Seguridad y middleware
- `helmet`, `rate-limit`, validación `zod`.
- Auth por `usuario`/`contrasena` en body.

## Endpoints
- `GET /health`: estado del servicio.
- `POST /blocks`: cadena completa.
- `POST /block`: bloque por `celhash`.
- `POST /tx`: ingresa voto a mempool.
- `POST /mine-slot`: minado/propuesta por líder del slot.
- `POST /acks`: estado de quorum por bloque.
- `POST /height`: altura actual.
- `POST /blocks-from`: bloques faltantes desde una altura.

## Flujo recomendado
1. Cliente/Backend envía voto con `POST /tx`.
2. Nodo líder del slot ejecuta `POST /mine-slot`.
3. Nodos convergen por consenso + resincronización incremental.
