UPDATE "users"
SET "country" = 'Chile',
    "updated_at" = NOW()
WHERE "country" IS NULL
   OR TRIM("country") = ''
   OR UPPER(TRIM("country")) IN ('CHILE', 'CL', 'CHL');
