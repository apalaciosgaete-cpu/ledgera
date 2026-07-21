UPDATE "users"
SET "subscription_plan" = 'PROFESIONAL',
    "updated_at" = NOW()
WHERE UPPER(TRIM("subscription_plan")) IN ('PRO', 'EMPRESA');

UPDATE "users"
SET "subscription_plan" = 'BASICO',
    "updated_at" = NOW()
WHERE UPPER(TRIM("subscription_plan")) IN ('FREE', 'BASIC');

UPDATE "billing_subscriptions"
SET "plan" = 'PROFESIONAL',
    "updatedAt" = NOW()
WHERE UPPER(TRIM("plan")) IN ('PRO', 'EMPRESA');

UPDATE "billing_subscriptions"
SET "plan" = 'BASICO',
    "updatedAt" = NOW()
WHERE UPPER(TRIM("plan")) IN ('FREE', 'BASIC');
