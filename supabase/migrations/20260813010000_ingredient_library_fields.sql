-- Skingredient — Ingredient Library content fields (hackathon MVP).
--
-- Adds 5 nullable content columns to the existing public.ingredients table —
-- no new table. common_name IS NOT NULL is what marks a row as a curated
-- Ingredient Library entry; the other seeded catalog ingredients (e.g.
-- Fragrance (Parfum), Titanium Dioxide) keep these columns null and simply
-- don't appear in the library, without needing a separate flag column.
--
-- Deliberately no "Peptides" row: it's a broad ingredient family, not a
-- canonical INCI identity, and none of the seeded catalog ingredients are a
-- specific peptide — so it's omitted rather than adding a fake generic row.
alter table public.ingredients add column common_name text;
alter table public.ingredients add column short_description text;
alter table public.ingredients add column benefits text[];
alter table public.ingredients add column best_for text[];
alter table public.ingredients add column caution text;

-- ---------------------------------------------------------------------------
-- Populate the 14 already-seeded catalog ingredients that are also core
-- Ingredient Library entries.
-- ---------------------------------------------------------------------------
update public.ingredients set
  common_name = 'Niacinamide',
  short_description = 'A form of vitamin B3 that helps regulate oil, strengthen the skin barrier, and even out tone.',
  benefits = array['Oil control', 'Barrier support', 'Tone evening'],
  best_for = array['Oiliness', 'Acne-prone skin', 'Dark spots', 'Barrier support'],
  caution = 'Generally well tolerated; very high concentrations may cause mild flushing in sensitive skin.'
where inci_name = 'Niacinamide';

update public.ingredients set
  common_name = 'Hyaluronic Acid',
  short_description = 'A humectant that draws water into the skin for immediate, lightweight hydration.',
  benefits = array['Hydration', 'Plumping', 'Lightweight moisture'],
  best_for = array['Dehydrated skin', 'All skin types', 'Fine lines from dryness'],
  caution = 'Can pull moisture from skin in very dry/low-humidity environments if used without a moisturizer on top.'
where inci_name = 'Sodium Hyaluronate';

update public.ingredients set
  common_name = 'Ceramides',
  short_description = 'Lipids naturally found in skin that help restore and reinforce the moisture barrier.',
  benefits = array['Barrier repair', 'Moisture retention', 'Soothing'],
  best_for = array['Dry skin', 'Compromised barrier', 'Sensitive skin'],
  caution = 'Generally well tolerated with no notable irritation risk.'
where inci_name = 'Ceramide NP';

update public.ingredients set
  common_name = 'Panthenol',
  short_description = 'Provitamin B5 that soothes irritation and supports hydration and barrier repair.',
  benefits = array['Soothing', 'Hydration', 'Barrier support'],
  best_for = array['Reactive skin', 'Post-procedure care', 'Dryness'],
  caution = 'Generally well tolerated; considered one of the safest, most beginner-friendly ingredients.'
where inci_name = 'Panthenol';

update public.ingredients set
  common_name = 'Centella Asiatica',
  short_description = 'A calming botanical extract traditionally used to soothe irritation and support healing.',
  benefits = array['Soothing', 'Redness reduction', 'Barrier support'],
  best_for = array['Redness', 'Reactive skin', 'Post-active recovery'],
  caution = 'Generally well tolerated with minimal irritation risk.'
where inci_name = 'Centella Asiatica Extract';

update public.ingredients set
  common_name = 'Salicylic Acid',
  short_description = 'An oil-soluble BHA exfoliant that clears pores and calms inflammation.',
  benefits = array['Pore clearing', 'Exfoliation', 'Anti-inflammatory'],
  best_for = array['Acne-prone skin', 'Blackheads', 'Oily/congested pores'],
  caution = 'Can cause dryness or peeling if overused; avoid combining with multiple strong exfoliants at once.'
where inci_name = 'Salicylic Acid';

update public.ingredients set
  common_name = 'Azelaic Acid',
  short_description = 'A gentle multi-tasking acid that calms redness, fades discoloration, and helps with breakouts.',
  benefits = array['Redness reduction', 'Brightening', 'Anti-acne'],
  best_for = array['Rosacea-prone skin', 'Post-acne marks', 'Uneven tone'],
  caution = 'Mild tingling on application is common and usually temporary.'
where inci_name = 'Azelaic Acid';

update public.ingredients set
  common_name = 'Retinol',
  short_description = 'A vitamin A derivative that speeds cell turnover to improve texture and fine lines over time.',
  benefits = array['Texture renewal', 'Fine line reduction', 'Cell turnover'],
  best_for = array['Uneven texture', 'Early signs of aging', 'Enlarged pores'],
  caution = 'Can cause dryness, peeling, and sun sensitivity; introduce gradually and always pair with sunscreen.'
where inci_name = 'Retinol';

update public.ingredients set
  common_name = 'Vitamin C',
  short_description = 'A potent antioxidant that brightens tone and helps protect skin from environmental damage.',
  benefits = array['Brightening', 'Antioxidant protection', 'Collagen support'],
  best_for = array['Dark spots', 'Dullness', 'Uneven tone'],
  caution = 'Can sting or irritate sensitive/reactive skin, especially at high concentrations.'
where inci_name = 'Ascorbic Acid';

update public.ingredients set
  common_name = 'Glycerin',
  short_description = 'A gentle, highly effective humectant that draws and holds moisture in the skin.',
  benefits = array['Hydration', 'Moisture retention'],
  best_for = array['All skin types', 'Dehydrated skin', 'Sensitive skin'],
  caution = 'Generally well tolerated with virtually no irritation risk.'
where inci_name = 'Glycerin';

update public.ingredients set
  common_name = 'Squalane',
  short_description = 'A lightweight, non-greasy emollient that softens skin and helps prevent moisture loss.',
  benefits = array['Moisture retention', 'Softening', 'Barrier support'],
  best_for = array['Dry skin', 'Combination skin', 'Sensitive skin'],
  caution = 'Generally well tolerated with minimal irritation risk.'
where inci_name = 'Squalane';

update public.ingredients set
  common_name = 'Benzoyl Peroxide',
  short_description = 'An antibacterial acne treatment that kills acne-causing bacteria and reduces inflammation.',
  benefits = array['Acne treatment', 'Antibacterial', 'Anti-inflammatory'],
  best_for = array['Active breakouts', 'Inflammatory acne'],
  caution = 'Can cause dryness and irritation; may bleach fabrics and hair on contact.'
where inci_name = 'Benzoyl Peroxide';

update public.ingredients set
  common_name = 'Zinc PCA',
  short_description = 'A mineral-derived ingredient that helps regulate oil production and calm irritation.',
  benefits = array['Oil control', 'Soothing', 'Anti-inflammatory'],
  best_for = array['Oily skin', 'Acne-prone skin'],
  caution = 'Generally well tolerated with minimal irritation risk.'
where inci_name = 'Zinc PCA';

update public.ingredients set
  common_name = 'PHA (Gluconolactone)',
  short_description = 'A gentle, larger-molecule exfoliating acid that smooths texture with less irritation than AHAs.',
  benefits = array['Gentle exfoliation', 'Texture smoothing', 'Hydration'],
  best_for = array['Sensitive skin', 'Beginners to exfoliation', 'Dry/reactive skin'],
  caution = 'Generally well tolerated but can still cause mild sensitivity if overused.'
where inci_name = 'Gluconolactone';

-- ---------------------------------------------------------------------------
-- Insert the 6 canonical ingredients missing from the seeded catalog.
-- "Peptides" deliberately omitted (see comment at top of file).
-- ---------------------------------------------------------------------------
insert into public.ingredients (inci_name, common_name, short_description, benefits, best_for, caution) values
  (
    'Retinaldehyde',
    'Retinaldehyde',
    'A vitamin A derivative that converts to retinoic acid faster than retinol, offering stronger results with a similar tolerability profile.',
    array['Texture renewal', 'Fine line reduction', 'Cell turnover'],
    array['Uneven texture', 'Early signs of aging', 'Retinol-experienced users'],
    'Can cause dryness and sun sensitivity; introduce gradually and always pair with sunscreen.'
  ),
  (
    'Tranexamic Acid',
    'Tranexamic Acid',
    'An ingredient that helps fade dark spots and even skin tone by interrupting pigment production.',
    array['Brightening', 'Dark spot fading', 'Tone evening'],
    array['Hyperpigmentation', 'Melasma-prone skin', 'Post-acne marks'],
    'Generally well tolerated with minimal irritation risk.'
  ),
  (
    'Urea',
    'Urea',
    'A humectant and gentle exfoliant that hydrates and softens rough, thickened skin.',
    array['Hydration', 'Gentle exfoliation', 'Softening'],
    array['Very dry skin', 'Rough/thickened patches', 'Flaky skin'],
    'High concentrations can sting on broken or very sensitized skin.'
  ),
  (
    'Sulfur',
    'Sulfur',
    'A traditional acne-fighting ingredient that absorbs excess oil and has mild antibacterial properties.',
    array['Oil absorption', 'Antibacterial', 'Acne treatment'],
    array['Oily/acne-prone skin', 'Blackheads', 'Mild breakouts'],
    'Can be drying and has a distinct sulfur odor; may irritate sensitive skin.'
  ),
  (
    'Petrolatum',
    'Petrolatum',
    'An occlusive that seals in moisture and protects the skin barrier, commonly used in healing balms.',
    array['Barrier protection', 'Moisture sealing', 'Healing support'],
    array['Very dry skin', 'Barrier repair', 'Chapped/irritated skin'],
    'Generally well tolerated but can feel heavy or greasy; not ideal for very oily/acne-prone skin.'
  ),
  (
    'Ectoin',
    'Ectoin',
    'A protective molecule that helps skin retain moisture and defend against environmental stress.',
    array['Hydration', 'Environmental protection', 'Soothing'],
    array['Sensitive skin', 'Environmentally stressed skin', 'Barrier support'],
    'Generally well tolerated with minimal irritation risk.'
  );
