/*
  # DisasterAid Crisis Relief Platform - Complete Database Schema

  ## Overview
  Complete schema for coordinating disaster relief including victims, NGOs, authorities,
  requests, offers, assignments, shelters, and real-time tracking.

  ## New Tables

  ### 1. requests
  Stores victim/citizen requests for aid (single or multi-beneficiary)
  - `id` (uuid, primary key)
  - `reporter_name` (text) - Person submitting request
  - `reporter_contact` (text) - Phone/email
  - `reporter_language` (text) - Preferred language
  - `preferred_communication` (text) - call/SMS/whatsapp
  - `location_gps` (geography point) - GPS coordinates
  - `location_address` (text) - Street address
  - `location_landmark` (text) - Nearby landmark
  - `location_area` (geography polygon, nullable) - For group coverage
  - `need_categories` (text[]) - rescue, food, water, medical, etc.
  - `num_adults` (integer) - Number of adults
  - `num_children` (integer) - Number of children
  - `num_elderly` (integer) - Number of elderly
  - `special_needs` (text) - Medical conditions, disabilities, pets
  - `priority_level` (text) - low, medium, high, critical
  - `is_sos` (boolean) - Auto-detected SoS flag
  - `sos_keywords` (text[]) - Keywords that triggered SoS
  - `evidence_urls` (text[]) - Photos/videos/voice notes
  - `signal_status` (text) - low battery, poor network, etc.
  - `status` (text) - new, triaged, assigned, in_progress, fulfilled, closed
  - `notes` (text) - Additional details
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. offers
  NGO and volunteer capacity and resources
  - `id` (uuid, primary key)
  - `organization_name` (text)
  - `contact_person` (text)
  - `contact_number` (text)
  - `categories` (text[]) - What they can provide
  - `capacity_details` (jsonb) - {"food": 200, "water": 500, etc.}
  - `coverage_radius_km` (numeric) - How far they can travel
  - `base_location` (geography point)
  - `available_vehicles` (text[]) - trucks, boats, ambulances
  - `available_medics` (integer)
  - `shift_start` (time)
  - `shift_end` (time)
  - `verification_status` (text) - pending, verified, rejected
  - `is_active` (boolean) - Currently available
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. assignments
  Matches between requests and offers
  - `id` (uuid, primary key)
  - `request_id` (uuid, foreign key)
  - `offer_id` (uuid, foreign key)
  - `assigned_by` (text) - Operator/system
  - `assignment_type` (text) - auto, manual
  - `eta_minutes` (integer) - Estimated time of arrival
  - `route_details` (jsonb) - Navigation waypoints
  - `status` (text) - assigned, en_route, arrived, completed, cancelled
  - `team_notes` (text)
  - `delivery_proof_urls` (text[])
  - `completion_signature` (text)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. shelters
  Emergency shelter locations and capacity
  - `id` (uuid, primary key)
  - `name` (text)
  - `location` (geography point)
  - `address` (text)
  - `total_capacity` (integer)
  - `current_occupancy` (integer)
  - `facilities` (text[]) - medical, food, water, charging, etc.
  - `contact_number` (text)
  - `status` (text) - operational, full, closed, evacuated
  - `last_updated` (timestamptz)
  - `created_at` (timestamptz)

  ### 5. supply_depots
  Supply storage and distribution points
  - `id` (uuid, primary key)
  - `name` (text)
  - `location` (geography point)
  - `address` (text)
  - `inventory` (jsonb) - {"food_packets": 5000, "water_bottles": 10000, etc.}
  - `contact_number` (text)
  - `operating_hours` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. blocked_routes
  Road closures and danger zones
  - `id` (uuid, primary key)
  - `route_path` (geography linestring) - Blocked road segment
  - `area_affected` (geography polygon, nullable) - Danger zone
  - `blockage_type` (text) - flooded, collapsed, landslide, etc.
  - `severity` (text) - low, medium, high, impassable
  - `reported_by` (text)
  - `reported_at` (timestamptz)
  - `cleared_at` (timestamptz, nullable)
  - `status` (text) - active, clearing, cleared

  ### 7. authority_teams
  Deployment teams and their status
  - `id` (uuid, primary key)
  - `team_name` (text)
  - `team_type` (text) - rescue, medical, distribution, transport
  - `team_size` (integer)
  - `current_location` (geography point, nullable)
  - `assigned_zone` (text)
  - `capabilities` (text[])
  - `contact_number` (text)
  - `status` (text) - available, deployed, offline
  - `shift_start` (timestamptz)
  - `shift_end` (timestamptz)
  - `created_at` (timestamptz)

  ### 8. crisis_alerts
  System-generated alerts and advisories
  - `id` (uuid, primary key)
  - `alert_type` (text) - shortage, surge, capacity_full, weather, sos_spike
  - `zone` (text)
  - `severity` (text) - info, warning, critical
  - `message` (text)
  - `metrics` (jsonb) - Supporting data
  - `is_acknowledged` (boolean)
  - `acknowledged_by` (text, nullable)
  - `acknowledged_at` (timestamptz, nullable)
  - `created_at` (timestamptz)

  ### 9. activity_logs
  Audit trail for all actions
  - `id` (uuid, primary key)
  - `action_type` (text)
  - `entity_type` (text) - request, offer, assignment, etc.
  - `entity_id` (uuid)
  - `performed_by` (text)
  - `details` (jsonb)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Create policies for authenticated access
*/

-- Create PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL,
  reporter_contact text NOT NULL,
  reporter_language text DEFAULT 'English',
  preferred_communication text DEFAULT 'call',
  location_gps geography(Point, 4326),
  location_address text,
  location_landmark text,
  location_area geography(Polygon, 4326),
  need_categories text[] NOT NULL,
  num_adults integer DEFAULT 0,
  num_children integer DEFAULT 0,
  num_elderly integer DEFAULT 0,
  special_needs text,
  priority_level text DEFAULT 'medium',
  is_sos boolean DEFAULT false,
  sos_keywords text[],
  evidence_urls text[],
  signal_status text,
  status text DEFAULT 'new',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text NOT NULL,
  contact_person text NOT NULL,
  contact_number text NOT NULL,
  categories text[] NOT NULL,
  capacity_details jsonb DEFAULT '{}',
  coverage_radius_km numeric DEFAULT 10,
  base_location geography(Point, 4326),
  available_vehicles text[],
  available_medics integer DEFAULT 0,
  shift_start time,
  shift_end time,
  verification_status text DEFAULT 'pending',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES offers(id) ON DELETE CASCADE,
  assigned_by text NOT NULL,
  assignment_type text DEFAULT 'manual',
  eta_minutes integer,
  route_details jsonb,
  status text DEFAULT 'assigned',
  team_notes text,
  delivery_proof_urls text[],
  completion_signature text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- shelters table
CREATE TABLE IF NOT EXISTS shelters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location geography(Point, 4326) NOT NULL,
  address text NOT NULL,
  total_capacity integer NOT NULL,
  current_occupancy integer DEFAULT 0,
  facilities text[],
  contact_number text,
  status text DEFAULT 'operational',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- supply_depots table
CREATE TABLE IF NOT EXISTS supply_depots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location geography(Point, 4326) NOT NULL,
  address text NOT NULL,
  inventory jsonb DEFAULT '{}',
  contact_number text,
  operating_hours text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- blocked_routes table
CREATE TABLE IF NOT EXISTS blocked_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path geography(LineString, 4326),
  area_affected geography(Polygon, 4326),
  blockage_type text NOT NULL,
  severity text DEFAULT 'medium',
  reported_by text NOT NULL,
  reported_at timestamptz DEFAULT now(),
  cleared_at timestamptz,
  status text DEFAULT 'active'
);

-- authority_teams table
CREATE TABLE IF NOT EXISTS authority_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  team_type text NOT NULL,
  team_size integer DEFAULT 1,
  current_location geography(Point, 4326),
  assigned_zone text,
  capabilities text[],
  contact_number text,
  status text DEFAULT 'available',
  shift_start timestamptz,
  shift_end timestamptz,
  created_at timestamptz DEFAULT now()
);

-- crisis_alerts table
CREATE TABLE IF NOT EXISTS crisis_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  zone text,
  severity text DEFAULT 'info',
  message text NOT NULL,
  metrics jsonb DEFAULT '{}',
  is_acknowledged boolean DEFAULT false,
  acknowledged_by text,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  performed_by text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON requests(priority_level);
CREATE INDEX IF NOT EXISTS idx_requests_sos ON requests(is_sos);
CREATE INDEX IF NOT EXISTS idx_requests_location ON requests USING GIST(location_gps);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_location ON offers USING GIST(base_location);

CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_request ON assignments(request_id);

CREATE INDEX IF NOT EXISTS idx_shelters_location ON shelters USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_shelters_status ON shelters(status);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON crisis_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON crisis_alerts(is_acknowledged);

-- Enable Row Level Security
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE authority_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requests
CREATE POLICY "Anyone can view requests"
  ON requests FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create requests"
  ON requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update requests"
  ON requests FOR UPDATE
  USING (true);

-- RLS Policies for offers
CREATE POLICY "Anyone can view offers"
  ON offers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create offers"
  ON offers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update offers"
  ON offers FOR UPDATE
  USING (true);

-- RLS Policies for assignments
CREATE POLICY "Anyone can view assignments"
  ON assignments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create assignments"
  ON assignments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update assignments"
  ON assignments FOR UPDATE
  USING (true);

-- RLS Policies for shelters
CREATE POLICY "Anyone can view shelters"
  ON shelters FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage shelters"
  ON shelters FOR ALL
  USING (true);

-- RLS Policies for supply_depots
CREATE POLICY "Anyone can view supply depots"
  ON supply_depots FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage supply depots"
  ON supply_depots FOR ALL
  USING (true);

-- RLS Policies for blocked_routes
CREATE POLICY "Anyone can view blocked routes"
  ON blocked_routes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage blocked routes"
  ON blocked_routes FOR ALL
  USING (true);

-- RLS Policies for authority_teams
CREATE POLICY "Anyone can view teams"
  ON authority_teams FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage teams"
  ON authority_teams FOR ALL
  USING (true);

-- RLS Policies for crisis_alerts
CREATE POLICY "Anyone can view alerts"
  ON crisis_alerts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage alerts"
  ON crisis_alerts FOR ALL
  USING (true);

-- RLS Policies for activity_logs
CREATE POLICY "Anyone can view activity logs"
  ON activity_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);