CREATE TABLE IF NOT EXISTS tax_simulations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  scenario_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  result_data JSONB NOT NULL,
  projected_risk DOUBLE PRECISION,
  projected_score DOUBLE PRECISION,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS tax_simulations_user_id_idx ON tax_simulations(user_id);
CREATE INDEX IF NOT EXISTS tax_simulations_scenario_type_idx ON tax_simulations(scenario_type);
CREATE INDEX IF NOT EXISTS tax_simulations_created_at_idx ON tax_simulations(created_at);
