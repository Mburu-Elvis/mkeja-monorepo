import { TenancyHistoryItem, TenantTenancyItem } from '../../core/services/landlord.service';

/** Labeled sample records when the API returns no tenancy history yet. */
export const DEMO_TENANCY_LABEL = 'Sample data — no records in system yet';

export function demoUnitTenancyHistory(): TenancyHistoryItem[] {
  return [
    {
      tenancyId: 9001,
      tenantId: 9001,
      tenantName: 'Jane Akinyi (sample)',
      tenantPhone: '254712345678',
      status: 'TERMINATED',
      leaseStartDate: '2024-01-01',
      leaseEndDate: '2025-06-30',
      moveInDate: '2024-01-01',
      moveOutDate: '2025-06-30',
      monthlyRent: 45000,
      rentDueDay: 5
    },
    {
      tenancyId: 9002,
      tenantId: 9002,
      tenantName: 'Peter Omondi (sample)',
      tenantPhone: '254723456789',
      status: 'ACTIVE',
      leaseStartDate: '2025-07-01',
      leaseEndDate: undefined,
      moveInDate: '2025-07-01',
      monthlyRent: 48000,
      rentDueDay: 5
    }
  ];
}

export function demoTenantTenancyHistory(): TenantTenancyItem[] {
  return [
    {
      tenancyId: 9003,
      propertyName: 'Greenview Estate (sample)',
      propertyAddress: 'Kilimani, Nairobi',
      unitNumber: 'A12',
      floorNumber: 1,
      status: 'ACTIVE',
      leaseStartDate: '2024-06-10',
      moveInDate: '2024-06-10',
      monthlyRent: 55000,
      rentDueDay: 5,
      landlordName: 'Sample Landlord'
    },
    {
      tenancyId: 9002,
      propertyName: 'Sunset Apartments (sample)',
      propertyAddress: 'Westlands, Nairobi',
      unitNumber: 'B204',
      floorNumber: 2,
      wing: 'Block B',
      status: 'TERMINATED',
      leaseStartDate: '2023-06-01',
      leaseEndDate: '2024-05-31',
      moveInDate: '2023-06-01',
      moveOutDate: '2024-05-31',
      monthlyRent: 42000,
      rentDueDay: 1,
      landlordName: 'Sample Landlord'
    },
    {
      tenancyId: 9001,
      propertyName: 'Riverside Court (sample)',
      propertyAddress: 'Parklands, Nairobi',
      unitNumber: 'C08',
      floorNumber: 3,
      status: 'TERMINATED',
      leaseStartDate: '2021-02-01',
      leaseEndDate: '2022-12-31',
      moveInDate: '2021-02-01',
      moveOutDate: '2022-12-31',
      monthlyRent: 35000,
      rentDueDay: 1,
      landlordName: 'Sample Landlord'
    }
  ];
}
