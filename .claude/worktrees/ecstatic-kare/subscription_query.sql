-- SQL query to show all users and their subscription status
SELECT 
  u.id AS user_id,
  u.email,
  u.name,
  u.stripeCustomerId,
  s.id AS subscription_id,
  s.stripeSubscriptionId,
  s.status AS subscription_status,
  s.plan AS subscription_plan,
  s.currentPeriodStart,
  s.currentPeriodEnd,
  s.updatedAt AS subscription_updated_at,
  (
    SELECT COUNT(*) 
    FROM "SubscriptionHistory" sh 
    WHERE sh.subscriptionId = s.id
  ) AS history_count,
  (
    SELECT sh.event
    FROM "SubscriptionHistory" sh
    WHERE sh.subscriptionId = s.id
    ORDER BY sh.createdAt DESC
    LIMIT 1
  ) AS latest_event,
  (
    SELECT sh.createdAt
    FROM "SubscriptionHistory" sh
    WHERE sh.subscriptionId = s.id
    ORDER BY sh.createdAt DESC
    LIMIT 1
  ) AS latest_event_date
FROM 
  "User" u
LEFT JOIN 
  "Subscription" s ON u.id = s.userId
ORDER BY 
  s.updatedAt DESC NULLS LAST; 