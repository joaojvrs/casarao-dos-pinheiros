# Supabase setup

This project uses Supabase as the production backend for hospitality bookings.

Apply the migration in `supabase/migrations/202605170001_hospitality_bookings.sql` to create:

- `accommodations`
- `guests`
- `bookings`
- `booking_extras`
- `booking_experiences`
- `audit_logs`
- `create_booking_atomic(...)`

Deploy the Edge Function in `supabase/functions/create-booking`.
Deploy the Edge Function in `supabase/functions/register-user`.
Deploy the Edge Function in `supabase/functions/invite-staff`.
Deploy the Edge Function in `supabase/functions/operations-summary`.

Required Edge Function secrets:

```bash
SUPABASE_URL=https://albifgtynofnayrkdmzz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The functions also accept `SERVICE_ROLE_KEY` for compatibility with existing Supabase secrets.

The frontend calls Edge Functions for sensitive actions. Official pricing, availability checks, CPF validation, capacity rules, user creation, staff invitations, operational CRM summaries, role metadata and atomic inserts happen server-side.

Create or promote the first master user manually in Supabase Auth by setting:

```json
{
  "role": "master",
  "permissions": {
    "bookings": true,
    "guests": true,
    "kitchen": true,
    "housekeeping": true,
    "roomService": true,
    "payments": true,
    "users": true,
    "reports": true,
    "settings": true
  }
}
```

The matching row in `profiles` should also have `role = 'master'`.
