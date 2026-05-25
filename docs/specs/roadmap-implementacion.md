# Spec: Roadmap de implementación

## Objetivo
Definir la evolución funcional del nodo minero para operación distribuida con consenso y sincronización entre nodos.

## Fase 1: Núcleo de nodo
- Exponer API HTTP para health, consulta de cadena y consulta por identificador de voto.
- Persistir bloques en PostgreSQL.
- Inicializar cadena con bloque génesis.

## Fase 2: Ingreso y propuesta de votos
- Recibir votos en mempool mediante `POST /tx`.
- Minar/proponer bloque por líder de slot (`POST /mine-slot`).
- Estandarizar estructura de bloque con metadatos de consenso.

## Fase 3: Consenso distribuido
- Protocolo entre nodos: `propose -> prevote -> precommit -> commit`.
- Quorum dinámico calculado sobre nodos activos.
- Confirmación de bloque por altura/ronda.

## Fase 4: Sincronización de estado
- Exponer altura local (`POST /height`).
- Exponer bloques faltantes por rango lógico (`POST /blocks-from`).
- Ejecutar reconciliación periódica entre peers.

## Fase 5: Seguridad operativa
- Autenticación API por credenciales de servicio.
- Mensajería P2P firmada con HMAC.
- Lista de nodos autorizados para participación en consenso.

## Fase 6: Operación y observabilidad
- Health checks para orquestación.
- Logs estructurados de eventos de consenso y sincronización.
- Escenarios de prueba de carga y reconexión en cluster.
