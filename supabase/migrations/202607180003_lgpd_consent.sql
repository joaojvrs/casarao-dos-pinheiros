-- LGPD: record the guest's consent to processing personal data (name, CPF, contact)
-- at the moment the booking is created. Stored on the booking so there is an auditable
-- timestamp of when and for which reservation consent was given.

alter table public.bookings
  add column if not exists lgpd_consent boolean not null default false,
  add column if not exists lgpd_consent_at timestamptz;

comment on column public.bookings.lgpd_consent is 'Guest consented to personal-data processing (LGPD) at booking time.';
comment on column public.bookings.lgpd_consent_at is 'Timestamp when LGPD consent was captured.';
