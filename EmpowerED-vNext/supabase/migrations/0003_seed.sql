-- Migration 0003: seed reference/master data.
insert into public.roles (name, description) values
  ('Admin','Full administrative access'),
  ('Manager','Resource manager access')
on conflict (name) do nothing;

insert into public.departments (name) values
  ('Data Engineering'),('Cloud'),('Application Dev'),('Learning Services'),
  ('QA & Testing'),('Infrastructure'),('ERP / SAP')
on conflict (name) do nothing;

insert into public.skill_categories (name) values
  ('Cloud'),('Data & AI'),('Application'),('ERP'),('DevOps')
on conflict (name) do nothing;

insert into public.skills (name) values
  ('Azure'),('AWS'),('Power BI'),('SAP'),('React'),('Node.js'),('Python'),
  ('Java'),('.NET'),('Kubernetes'),('Terraform'),('Snowflake'),('Salesforce'),
  ('Angular'),('Machine Learning')
on conflict (name) do nothing;

-- Seed the approved admin (adjust email before running in your project)
insert into public.users (email, full_name, role) values
  ('admin@company.com','Administrator','Admin')
on conflict (email) do nothing;
