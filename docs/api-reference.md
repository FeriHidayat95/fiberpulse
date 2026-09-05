# FiberPulse REST API & WebSocket Reference

This document outlines the core HTTP API endpoints and WebSocket channels for FiberPulse.

---

## Authentication and Session

### `POST /api/login`
Authenticates an administrator or field technician.

- **Request Body:**
  ```json
  {
    "email": "admin@fiberpulse.io",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "1|sanctum_token_hash...",
    "user": {
      "id": 1,
      "name": "System Administrator",
      "email": "admin@fiberpulse.io",
      "role": "admin"
    }
  }
  ```

---

## Operations Dashboard

### `GET /api/dashboard/summary`
Returns high-level network health, subscriber counts, and technician availability.

- **Response (200 OK):**
  ```json
  {
    "total_odp": 4,
    "total_subscribers": 4,
    "active_tasks": 1,
    "available_technicians": 1,
    "capacity_utilization_pct": 59.3
  }
  ```

---

## Geospatial ODP and Fiber Topology

### `GET /api/odps`
Retrieves all Optical Distribution Points with GPS coordinates and port capacities.

- **Query Parameters:**
  - `status` *(optional)*: `Aktif` | `Penuh` | `Maintenance`
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "ODP-CTR-01",
      "dusun": "Central Hub District",
      "total_ports": 16,
      "used_ports": 6,
      "status": "Aktif",
      "latitude": "-6.2088000",
      "longitude": "106.8456000",
      "address": "Metropolitan Backbone Sector 1, Post #104"
    }
  ]
  ```

### `GET /api/odps/{id}/ports`
Returns port allocation map and attached subscriber lines for a given ODP.

---

## Field Technician Work Orders

### `GET /api/tasks`
Lists work orders with filtering by technician, status, and date.

### `POST /api/tasks/{id}/start`
Transitions a task state to `In Progress` (`Dikerjakan`) and captures starting GPS coordinates.

### `POST /api/tasks/{id}/complete`
Closes a work order with optical signal readings and hardware verification.

- **Request Body:**
  ```json
  {
    "modem_sn": "ONT-HW-20260901",
    "optical_power_dbm": "-19.4",
    "kabel_fo_used": "45 Meter",
    "technician_notes": "Drop cable securely routed. Optical power calibrated."
  }
  ```

---

## Asset and Inventory Lifecycle

### `GET /api/assets`
Returns real-time stock levels of ONTs, drop cables, and optical splitters.

### `GET /api/assets/transactions`
Audit trail of stock movements (intake, allocation to technician, damaged returns).

---

## Real-Time WebSocket Channels (Laravel Reverb)

Client connects via standard WebSocket or Laravel Echo:
- **Host:** `ws://localhost:8080` (or `wss://api.yourdomain.com/app`)

| Channel | Event | Description |
| :--- | :--- | :--- |
| `odp-updates` | `OdpUpdated` | Broadcast when port capacity changes or new ODP is placed on map. |
| `task-dispatch` | `TaskCreated` / `TaskStatusChanged` | Real-time work order push to field technician PWA. |
