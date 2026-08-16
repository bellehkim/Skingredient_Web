-- Recategorizes "Paula's Choice Skin Perfecting 2% BHA Liquid" from
-- Toner/Essence to Treatment — a product-primary-function correction, not a
-- rule that "contains Salicylic Acid => Treatment" (a Salicylic Acid
-- cleanser, for example, stays a Cleanser). This product's primary role is
-- a leave-on BHA exfoliating treatment, not hydration/toning, so Treatment
-- is the more accurate category in this app's six-category taxonomy. No
-- schema change needed — 'Treatment' is already a valid products.category
-- value.
update public.products
set category = 'Treatment'
where brand = 'Paula''s Choice' and product_name = 'Skin Perfecting 2% BHA Liquid';
