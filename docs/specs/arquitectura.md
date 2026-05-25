# Spec: Arquitectura y lógica interna

## 1) Rol del servicio
`votacion-minero` es un nodo de blockchain simplificado que:
- recibe votos desde backend padrón,
- mina bloques con esos votos,
- persiste cadena en MongoDB,
- sincroniza cadena con pares vía WebSocket.

## 2) Componentes
- `app/index.js`
  - Bootstrap del proceso.
  - Inicializa `Blockchain`, `P2pServer` y app Express.
- `app/app.js`
  - Config global de Express y middlewares de seguridad.
  - Endpoint operativo `/health`.
- `app/routes/blockchain.routes.js`
  - Definición de rutas HTTP del dominio blockchain.
- `app/controllers/blockchain.controller.js`
  - Adaptadores HTTP por endpoint.
- `app/services/blockchain.service.js`
  - Lógica de dominio reutilizable (búsqueda/minado+sync).
- `app/middlewares/*`
  - `auth`, `validate-body`, `error-handler`.
- `app/validators/blockchain.js`
  - Contratos de entrada con Zod.
- `app/p2p-server.js`
  - Red P2P por `ws`.
  - Mensajería tipo `CHAIN`.
  - Sincronización de cadena entre sockets.
- `blockchain/blockchain.js`
  - Carga inicial desde Mongo (`cargaChain`).
  - Minado lógico (`addBlock`).
  - Persistencia (`saveBlock`).
  - Validación y reemplazo de cadena (`isValidChain`, `replaceChain`).
- `blockchain/block.js`
  - Estructura del bloque.
  - Génesis.
  - Cálculo de hash y minería.
- `blockchain/db/*`
  - Conexión PostgreSQL y repositorio de bloques.

## 3) Flujo operativo end-to-end
1. Arranca proceso Node.
2. Se conecta a MongoDB.
3. Intenta reconstruir cadena desde colección `Block`.
4. Si no hay datos, crea génesis y persiste.
5. Atiende API HTTP + conecta peers P2P.
6. En cada voto:
   - recibe transacción en `/tx`,
   - líder de slot propone bloque (`/mine-slot`),
   - consenso `propose -> prevote -> precommit -> commit`,
   - guarda en PostgreSQL,
   - resincroniza nodos por altura (`/height`, `/blocks-from`).

## 4) Modelo de datos de bloque
- `timestamp: Date`
- `lastHash: String`
- `hash: String`
- `data[0].celhash: String`
- `data[0].voto1: Number`
- `data[0].voto2: Number`
- `data[0].voto3: Number`
- `difficulty: Number`

Observación: el diseño actual guarda un único voto por bloque en `data[0]`.
