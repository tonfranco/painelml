-- Atualizar alguns shipments com dados de SLA de exemplo
UPDATE "Shipment" 
SET 
  "slaStatus" = 'on_time',
  "slaService" = 'standard',
  "slaExpectedDate" = NOW() + INTERVAL '2 days',
  "handlingLimit" = NOW() + INTERVAL '2 days',
  "deliveryLimit" = NOW() + INTERVAL '5 days',
  "deliveryFinal" = NOW() + INTERVAL '7 days'
WHERE "meliShipmentId" = '45739735738';

UPDATE "Shipment" 
SET 
  "slaStatus" = 'on_time',
  "slaService" = 'xd_same_day',
  "slaExpectedDate" = NOW() + INTERVAL '6 hours',
  "handlingLimit" = NOW() + INTERVAL '6 hours',
  "deliveryLimit" = NOW() + INTERVAL '1 day',
  "deliveryFinal" = NOW() + INTERVAL '2 days'
WHERE "meliShipmentId" = '45743290057';

UPDATE "Shipment" 
SET 
  "slaStatus" = 'delayed',
  "slaService" = 'next_day',
  "slaExpectedDate" = NOW() - INTERVAL '2 hours',
  "handlingLimit" = NOW() - INTERVAL '2 hours',
  "deliveryLimit" = NOW() + INTERVAL '1 day',
  "deliveryFinal" = NOW() + INTERVAL '3 days'
WHERE "status" IN ('pending', 'handling', 'ready_to_ship')
LIMIT 1;
