-- ==============================================================
-- Sample seed data
-- Default password for all seeded users: "Password123!"
-- (bcrypt hash below corresponds to that password)
-- ==============================================================

INSERT INTO users (name, email, password_hash, role, phone) VALUES
('Admin User',   'admin@restaurant.com',   '$2b$10$P0zQJUvinoEFAzd1UyJL4e2dlcST5iVz5n.qYz1W6fbSg8k.8Nl0q', 'admin',   '9000000001'),
('Casey Cashier','cashier@restaurant.com', '$2b$10$P0zQJUvinoEFAzd1UyJL4e2dlcST5iVz5n.qYz1W6fbSg8k.8Nl0q', 'cashier', '9000000002'),
('Wendy Waiter',  'waiter@restaurant.com', '$2b$10$P0zQJUvinoEFAzd1UyJL4e2dlcST5iVz5n.qYz1W6fbSg8k.8Nl0q', 'waiter',  '9000000003')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (name, description) VALUES
('Starters', 'Appetizers and small plates'),
('Main Course', 'Hearty main dishes'),
('Breads', 'Indian breads'),
('Beverages', 'Cold and hot drinks'),
('Desserts', 'Sweet endings')
ON CONFLICT (name) DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, is_available) VALUES
((SELECT id FROM categories WHERE name = 'Starters'), 'Paneer Tikka', 'Grilled cottage cheese skewers', 220.00, TRUE),
((SELECT id FROM categories WHERE name = 'Starters'), 'Veg Spring Rolls', 'Crispy vegetable rolls', 180.00, TRUE),
((SELECT id FROM categories WHERE name = 'Main Course'), 'Butter Chicken', 'Creamy tomato chicken curry', 320.00, TRUE),
((SELECT id FROM categories WHERE name = 'Main Course'), 'Paneer Butter Masala', 'Cottage cheese in rich gravy', 280.00, TRUE),
((SELECT id FROM categories WHERE name = 'Main Course'), 'Veg Biryani', 'Fragrant basmati rice with vegetables', 240.00, TRUE),
((SELECT id FROM categories WHERE name = 'Breads'), 'Butter Naan', 'Soft leavened bread', 45.00, TRUE),
((SELECT id FROM categories WHERE name = 'Breads'), 'Tandoori Roti', 'Whole wheat clay-oven bread', 30.00, TRUE),
((SELECT id FROM categories WHERE name = 'Beverages'), 'Masala Chai', 'Spiced Indian tea', 40.00, TRUE),
((SELECT id FROM categories WHERE name = 'Beverages'), 'Fresh Lime Soda', 'Refreshing lime soda', 60.00, TRUE),
((SELECT id FROM categories WHERE name = 'Desserts'), 'Gulab Jamun', 'Sweet milk dumplings in syrup', 90.00, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO restaurant_tables (table_number, capacity, status) VALUES
('T1', 2, 'available'),
('T2', 4, 'available'),
('T3', 4, 'occupied'),
('T4', 6, 'available'),
('T5', 2, 'reserved'),
('T6', 8, 'available')
ON CONFLICT (table_number) DO NOTHING;
