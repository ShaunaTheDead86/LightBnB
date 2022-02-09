SELECT properties.city, COUNT(reservations.id) as total_reservations
FROM properties
JOIN reservations ON reservations.property_id = properties.id
WHERE properties.id = reservations.property_id
GROUP BY properties.city
ORDER BY total_reservations DESC;