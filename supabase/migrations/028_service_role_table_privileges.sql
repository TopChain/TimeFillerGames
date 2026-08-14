-- Server routes and trusted Edge Functions use service_role for application
-- persistence. RLS bypass does not replace PostgreSQL table privileges, so
-- reproduce those grants explicitly instead of relying on project-local state.
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Keep later migrations reproducible when they add public tables or sequences.
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;
