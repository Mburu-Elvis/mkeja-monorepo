export type AgentFunctionStatus = 'live' | 'soon';

export interface AgentFunction {
  id: string;
  label: string;
  description: string;
  status: AgentFunctionStatus;
  route?: string;
  requiresKyc?: boolean;
}

export interface AgentFunctionGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
  functions: AgentFunction[];
}

export const AGENT_FUNCTION_GROUPS: AgentFunctionGroup[] = [
  {
    id: 'property-operations',
    title: 'Property Operations',
    description: 'Listings, vacancies, inspections, and unit management.',
    icon: 'building',
    functions: [
      { id: 'manage-listings', label: 'Manage property listings', description: 'View and update assigned properties.', status: 'live', route: '/agent/properties', requiresKyc: true },
      { id: 'advertise-vacancies', label: 'Advertise vacancies', description: 'Publish units on House Hunt.', status: 'live', route: '/agent/properties', requiresKyc: true },
      { id: 'conduct-inspections', label: 'Conduct inspections', description: 'Schedule and record property inspections.', status: 'soon' },
      { id: 'manage-units', label: 'Manage units', description: 'Add units and track occupancy status.', status: 'live', route: '/agent/properties', requiresKyc: true }
    ]
  },
  {
    id: 'tenant-acquisition',
    title: 'Tenant Acquisition',
    description: 'Applications, screening, references, and lease execution.',
    icon: 'users',
    functions: [
      { id: 'receive-applications', label: 'Receive applications', description: 'Review House Hunt interest leads.', status: 'live', route: '/agent/leads', requiresKyc: true },
      { id: 'screen-tenants', label: 'Screen tenants', description: 'Evaluate applicant suitability.', status: 'soon' },
      { id: 'verify-references', label: 'Verify references', description: 'Contact and validate tenant references.', status: 'soon' },
      { id: 'recommend-tenants', label: 'Recommend tenants', description: 'Shortlist tenants for owner approval.', status: 'soon' },
      { id: 'execute-leases', label: 'Execute lease agreements', description: 'Invite tenants and complete lease signing.', status: 'live', route: '/agent/tenants/invite', requiresKyc: true }
    ]
  },
  {
    id: 'tenant-management',
    title: 'Tenant Management',
    description: 'Records, complaints, and move coordination.',
    icon: 'clipboard',
    functions: [
      { id: 'manage-records', label: 'Manage tenant records', description: 'View active tenancies and tenant profiles.', status: 'live', route: '/agent/tenants', requiresKyc: true },
      { id: 'handle-complaints', label: 'Handle complaints', description: 'Log and resolve tenant complaints.', status: 'soon' },
      { id: 'coordinate-moves', label: 'Coordinate move-ins and move-outs', description: 'Track handover and vacancy transitions.', status: 'soon' }
    ]
  },
  {
    id: 'rent-collection',
    title: 'Rent Collection',
    description: 'Invoices, collections, arrears, and receipts.',
    icon: 'creditCard',
    functions: [
      { id: 'generate-invoices', label: 'Generate invoices', description: 'Issue monthly rent invoices.', status: 'soon' },
      { id: 'collect-rent', label: 'Collect rent', description: 'Track M-PESA and wallet rent payments.', status: 'live', route: '/agent/remittances', requiresKyc: true },
      { id: 'follow-arrears', label: 'Follow up on arrears', description: 'Monitor overdue balances.', status: 'soon' },
      { id: 'issue-reminders', label: 'Issue reminders', description: 'Send automated rent reminders.', status: 'soon' },
      { id: 'process-receipts', label: 'Process receipts', description: 'Issue payment confirmations to tenants.', status: 'soon' }
    ]
  },
  {
    id: 'maintenance',
    title: 'Maintenance Coordination',
    description: 'Requests, contractors, repairs, and completion checks.',
    icon: 'wrench',
    functions: [
      { id: 'receive-requests', label: 'Receive maintenance requests', description: 'Intake tenant maintenance tickets.', status: 'soon' },
      { id: 'dispatch-contractors', label: 'Dispatch contractors', description: 'Assign vetted service providers.', status: 'soon' },
      { id: 'monitor-repairs', label: 'Monitor repairs', description: 'Track work orders in progress.', status: 'soon' },
      { id: 'verify-completion', label: 'Verify completion', description: 'Confirm repairs and close tickets.', status: 'soon' }
    ]
  },
  {
    id: 'financial-management',
    title: 'Financial Management',
    description: 'Expenses, fees, statements, and owner payouts.',
    icon: 'pieChart',
    functions: [
      { id: 'record-expenses', label: 'Record expenses', description: 'Capture property operating costs.', status: 'soon' },
      { id: 'deduct-fees', label: 'Deduct management fees', description: 'Apply agency fee schedules.', status: 'soon' },
      { id: 'owner-statements', label: 'Generate owner statements', description: 'Monthly owner financial summaries.', status: 'live', route: '/agent/remittances/statement', requiresKyc: true },
      { id: 'owner-payouts', label: 'Process owner payouts', description: 'Remit collected rent to owners.', status: 'live', route: '/agent/remittances', requiresKyc: true }
    ]
  },
  {
    id: 'reporting',
    title: 'Reporting',
    description: 'Occupancy, income, maintenance, and arrears insights.',
    icon: 'chart',
    functions: [
      { id: 'occupancy-reports', label: 'Occupancy reports', description: 'Vacancy and occupancy trends.', status: 'soon' },
      { id: 'income-reports', label: 'Income reports', description: 'Rent collection performance.', status: 'soon' },
      { id: 'maintenance-reports', label: 'Maintenance reports', description: 'Repair volume and spend.', status: 'soon' },
      { id: 'arrears-reports', label: 'Arrears reports', description: 'Outstanding rent by unit and tenant.', status: 'soon' }
    ]
  }
];

export const AGENT_SIDEBAR_SECTIONS = AGENT_FUNCTION_GROUPS.map((group) => ({
  id: group.id,
  title: group.title,
  items: group.functions.filter((fn) => fn.status === 'live' && fn.route)
}));
