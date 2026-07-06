# Mkeja Notification Service

Real-time, multi-channel notification engine for the Mkeja platform.

## Run locally

```bash
# Requires PostgreSQL (same DB as onboarding/discovery)
mvn spring-boot:run
```

- Port: **8083**
- REST: `/api/v1/notifications`
- WebSocket: `/ws/notifications?token=<jwt>`

## Delivery channels

| Channel | Description |
|---------|-------------|
| **IN_APP** | Persists to `tbl_notification` (inbox history) |
| **WEB** | Real-time WebSocket push to connected browsers |
| **PUSH** | Mobile/web push via registered device tokens (FCM/APNS stub) |
| **SMS** | SMS delivery stub (Africa's Talking ready) |
| **EMAIL** | Email delivery stub (SendGrid/SES ready) |

## Real-time WebSocket protocol

Connect with JWT:

```
ws://localhost:8083/ws/notifications?token=<access_token>
```

Server messages:

```json
{ "type": "NOTIFICATION", "payload": { "id": 1, "title": "...", ... } }
{ "type": "UNREAD_COUNT", "payload": { "count": 3 } }
```

Client keepalive: send `PING`, receive `PONG`.

## Event ingestion (internal)

```http
POST /api/v1/notifications/events
X-Service-Key: mkeja-internal-dev-key
```

## Push device registration

```http
POST /api/v1/notifications/devices
Authorization: Bearer <token>

{ "token": "fcm-or-apns-token", "platform": "ANDROID" }
```

## Supported events

`INVITATION_SENT`, `INVITATION_ACCEPTED`, `TENANT_ONBOARDED`, `LEASE_SIGNED`, `TENANCY_CREATED`, `TENANCY_TERMINATED`, `PROPERTY_CREATED`, `PROPERTY_VERIFIED`, `UNIT_CREATED`, `LISTING_UPDATED`, `KYC_VERIFIED`, `KYC_REJECTED`, `LISTING_INTEREST_CREATED`, `LANDLORD_REGISTERED`

## Frontend proxy

`mkeja-web/proxy.conf.json` routes:
- `/api/v1/notifications/**` → `:8083`
- `/ws/notifications` → `ws://localhost:8083` (with `ws: true`)
