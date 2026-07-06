# Mkeja Discovery Service

Tenant house hunting and landlord lead capture for the Mkeja platform.

## Run locally

```bash
# Requires PostgreSQL (same DB as onboarding) and onboarding service for auth tokens
mvn spring-boot:run
```

- Port: **8082**
- Base path: `/api/v1/discovery`

## Features

- Search discoverable vacant units (public browse)
- Rule-based recommendations for KYC-approved tenants
- Save listings and express interest (creates landlord leads)
- Tenant preferences (budget, area, bedrooms)
- Landlord lead inbox (`/discovery/leads`)

## Landlord listing setup (onboarding API)

```http
PATCH /api/v1/properties/{propertyId}/units/{unitId}/listing
{
  "discoverable": true,
  "autoRecommend": true,
  "promoted": false,
  "listingDescription": "Bright 2-bed near CBD"
}
```

Requirements: vacant unit, verified property, approved landlord KYC.

## Frontend proxy

`mkeja-web/proxy.conf.json` routes `/api/v1/discovery/**` to port 8082.

## Architecture

Discovery reads onboarding inventory via shared PostgreSQL catalog queries and owns:

- `tbl_tenant_preference`
- `tbl_saved_listing`
- `tbl_listing_interest`

JWT validation uses the same secret as onboarding (`jwt.secret`).
