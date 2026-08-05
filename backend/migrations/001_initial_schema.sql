CREATE TABLE users (
  id text PRIMARY KEY,
  directory_object_guid uuid UNIQUE,
  windows_username text,
  user_principal_name text,
  employee_number text NOT NULL,
  display_name text NOT NULL,
  email text,
  department text NOT NULL,
  job_level text NOT NULL CHECK (job_level IN (
    'Chairman', 'Deputy', 'Advisor', 'Expert', 'Assistant',
    'Deputy Assistant', 'General Manager', 'Assistant General Manager',
    'Level 1', 'Level 2', 'Level 3'
  )),
  active boolean NOT NULL DEFAULT true,
  directory_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_employee_number_upper_idx ON users (upper(employee_number));
CREATE UNIQUE INDEX users_windows_username_upper_idx
  ON users (upper(windows_username)) WHERE windows_username IS NOT NULL;
CREATE UNIQUE INDEX users_upn_upper_idx
  ON users (upper(user_principal_name)) WHERE user_principal_name IS NOT NULL;

CREATE TABLE user_roles (
  user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN (
    'employee', 'manager', 'pr', 'transportation', 'timing', 'salary'
  )),
  PRIMARY KEY (user_id, role)
);

CREATE SEQUENCE travel_request_number_seq;

CREATE TABLE travel_requests (
  id text PRIMARY KEY,
  employee_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  manager_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  origin_city text NOT NULL,
  destination_city text NOT NULL,
  departure_at timestamptz NOT NULL,
  return_at timestamptz NOT NULL,
  trip_type text NOT NULL CHECK (trip_type IN ('one-way', 'round-trip')),
  accommodation_type text NOT NULL CHECK (accommodation_type IN (
    'none', 'room-only', 'room-and-food', 'half-board', 'bed-and-breakfast',
    'egas-arranged', 'other-company-arranged', 'employee-arranged'
  )),
  transportation_method text NOT NULL,
  stage text NOT NULL CHECK (stage IN (
    'manager-review', 'pr-review', 'transportation-review', 'timing-review',
    'salary-finalization', 'completed', 'cancelled'
  )),
  verified_departure_at timestamptz,
  verified_return_at timestamptz,
  verified_same_day_hours double precision NOT NULL DEFAULT 0 CHECK (verified_same_day_hours >= 0),
  verified_return_day_hours double precision NOT NULL DEFAULT 0 CHECK (verified_return_day_hours >= 0),
  transportation_cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (transportation_cost >= 0),
  transportation_cost_verified boolean NOT NULL DEFAULT false,
  claimed_transportation_cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (claimed_transportation_cost >= 0),
  bonus_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (bonus_amount >= 0),
  penalty_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (penalty_amount >= 0),
  salary_preview jsonb NOT NULL CHECK (jsonb_typeof(salary_preview) = 'object'),
  final_salary jsonb CHECK (final_salary IS NULL OR jsonb_typeof(final_salary) = 'object'),
  cancellation_reason text,
  notes text NOT NULL DEFAULT '',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(attachments) = 'array'),
  pending_employee_response boolean NOT NULL DEFAULT false,
  time_needs_verification boolean NOT NULL DEFAULT false,
  submitted_request jsonb NOT NULL CHECK (jsonb_typeof(submitted_request) = 'object'),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1,
  CHECK (
    (trip_type = 'one-way' AND return_at = departure_at)
    OR (trip_type = 'round-trip' AND return_at > departure_at)
  )
);

CREATE INDEX travel_requests_employee_created_idx
  ON travel_requests (employee_id, created_at DESC);
CREATE INDEX travel_requests_manager_stage_idx
  ON travel_requests (manager_id, stage, created_at DESC);
CREATE INDEX travel_requests_stage_created_idx
  ON travel_requests (stage, created_at DESC);

CREATE TABLE audit_events (
  id text PRIMARY KEY,
  request_id text NOT NULL REFERENCES travel_requests(id) ON DELETE RESTRICT,
  actor_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_role text NOT NULL CHECK (actor_role IN (
    'employee', 'manager', 'pr', 'transportation', 'timing', 'salary'
  )),
  action text NOT NULL CHECK (action IN (
    'submit', 'approve', 'reject', 'edit', 'finalize', 'request-info'
  )),
  from_stage text CHECK (from_stage IS NULL OR from_stage IN (
    'manager-review', 'pr-review', 'transportation-review', 'timing-review',
    'salary-finalization', 'completed', 'cancelled'
  )),
  to_stage text NOT NULL CHECK (to_stage IN (
    'manager-review', 'pr-review', 'transportation-review', 'timing-review',
    'salary-finalization', 'completed', 'cancelled'
  )),
  changes jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(changes) = 'object'),
  note text,
  created_at timestamptz NOT NULL
);

CREATE INDEX audit_events_request_created_idx
  ON audit_events (request_id, created_at, id);

CREATE TABLE price_revisions (
  id text PRIMARY KEY,
  request_id text NOT NULL REFERENCES travel_requests(id) ON DELETE RESTRICT,
  stage text NOT NULL CHECK (stage IN (
    'manager-review', 'pr-review', 'transportation-review', 'timing-review',
    'salary-finalization', 'completed', 'cancelled'
  )),
  actor_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_role text NOT NULL CHECK (actor_role IN (
    'employee', 'manager', 'pr', 'transportation', 'timing', 'salary'
  )),
  previous_calculation jsonb NOT NULL CHECK (jsonb_typeof(previous_calculation) = 'object'),
  new_calculation jsonb NOT NULL CHECK (jsonb_typeof(new_calculation) = 'object'),
  difference numeric(14,2) NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(changes) = 'object'),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL
);

CREATE INDEX price_revisions_request_created_idx
  ON price_revisions (request_id, created_at, id);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  last_access_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_created_idx ON sessions (user_id, created_at DESC);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

CREATE OR REPLACE FUNCTION reject_immutable_history_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only; % is not allowed', TG_TABLE_NAME, TG_OP;
END;
$$;

CREATE TRIGGER audit_events_immutable
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION reject_immutable_history_change();

CREATE TRIGGER price_revisions_immutable
BEFORE UPDATE OR DELETE ON price_revisions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_history_change();
