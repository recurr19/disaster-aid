export interface Request {
  id: string;
  reporter_name: string;
  reporter_contact: string;
  reporter_language: string;
  preferred_communication: string;
  location_address: string;
  location_landmark?: string;
  need_categories: string[];
  num_adults: number;
  num_children: number;
  num_elderly: number;
  special_needs?: string;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  is_sos: boolean;
  sos_keywords?: string[];
  status: 'new' | 'triaged' | 'assigned' | 'in_progress' | 'fulfilled' | 'closed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  organization_name: string;
  contact_person: string;
  contact_number: string;
  categories: string[];
  capacity_details: Record<string, number>;
  coverage_radius_km: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  created_at: string;
}

export interface Assignment {
  id: string;
  request_id: string;
  offer_id: string;
  assigned_by: string;
  status: 'assigned' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
  eta_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface Shelter {
  id: string;
  name: string;
  address: string;
  total_capacity: number;
  current_occupancy: number;
  facilities: string[];
  contact_number: string;
  status: 'operational' | 'full' | 'closed' | 'evacuated';
  last_updated: string;
}

export interface SupplyDepot {
  id: string;
  name: string;
  address: string;
  inventory: Record<string, number>;
  contact_number: string;
  operating_hours: string;
}

export interface AuthorityTeam {
  id: string;
  team_name: string;
  team_type: 'rescue' | 'medical' | 'distribution' | 'transport';
  team_size: number;
  assigned_zone: string;
  capabilities: string[];
  contact_number: string;
  status: 'available' | 'deployed' | 'offline';
  shift_start: string;
  shift_end: string;
}

export interface CrisisAlert {
  id: string;
  alert_type: string;
  zone: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metrics: Record<string, any>;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface CrisisMetrics {
  totalRequests: number;
  unmetRequests: number;
  sosRequests: number;
  activeAssignments: number;
  fulfilledToday: number;
  shelterOccupancy: number;
  availableTeams: number;
  categoryBreakdown: Record<string, number>;
  zoneBreakdown: Record<string, number>;
}
