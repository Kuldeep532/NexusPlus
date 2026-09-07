# Nexus Computer Agent

Nexus Computer Agent is a lightweight local-network bridge for Nexus Plus. It is designed to run directly on Windows, Ubuntu/Linux, or macOS and expose a small HTTP API to the phone. The phone and computer must be reachable on the same LAN, the phone's hotspot, or another directly routed local network.

The agent does not require a separate Electron/desktop UI or a custom native application build. The implementation is intentionally portable: use the operating system's default runtime and APIs for platform integration.

## Local protocol

Service discovery name: `_nexus-computer-agent._tcp`

Default port: `49152` (override with `NEXUS_COMPUTER_AGENT_PORT`)

Health endpoint: `GET /v1/health`

Execution endpoint: `POST /v1/execute`

The execution endpoint accepts a JSON body:

```json
{
  "action": "open-url",
  "args": { "url": "https://example.com" },
  "requestId": "optional-id"
}
```

The server must only expose allow-listed actions. Examples include `open-url`, `open-file`, `open-folder`, `launch-app`, `system-info`, and `power-state`. High-risk actions must require explicit confirmation from Nexus Plus before execution.

## Connectivity

1. Computer and phone on the same Wi-Fi: connect using the discovered local hostname/IP.
2. Phone hotspot: connect using the computer's hotspot-assigned local IP.
3. Other LAN/direct local routes: connect using the locally reachable IP/hostname.
4. Internet/cloud is not required for computer control once both devices are on the same reachable network.

The mobile client uses HTTP for the initial portable implementation. A future WebSocket channel can reuse the same protocol envelope for low-latency streaming without changing action semantics.

## Native OS policy

Windows: use built-in Windows APIs/commands available to the default OS environment.

Ubuntu/Linux: use standard desktop utilities and D-Bus where available.

macOS: use built-in `open`, `osascript`, and system frameworks exposed through the selected runtime.

Do not bundle a second copy of the operating system or a heavyweight desktop framework merely to execute these operations.
