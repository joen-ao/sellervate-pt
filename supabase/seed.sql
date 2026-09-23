-- Seed for local development. Loaded by `supabase db reset` through
-- config.toml [db.seed] sql_paths = ["./seed.sql", "./seed/*.sql"].
--
-- Fixed UUIDs so the README, curl examples and the other branches can
-- reference rows by hand. Convention: 00000000-0000-0000-0000-0000000000NN
--   ...0001-0003  brands
--   ...0011-0012  team leads
--   ...0021-0023  specialists
--   ...0101-0303  replies (1xx voltaire, 2xx kraftco, 3xx lume)
--   ...0001NNN    the review of reply NNN
--
-- Every sent_at is relative to now(), never an absolute date, so the queue
-- still reads "yesterday" whenever this is reset.

-- ---------------------------------------------------------------- brands
insert into brands (id, name, slug, voice_guidelines) values
('00000000-0000-0000-0000-000000000001','Voltaire','voltaire',
 $$Voltaire sells electric scooters. Tone: calm, technical, confident.
Procedures:
1. Diagnose before you offer anything. Ask for the error code on the display and the mileage.
2. Check order history for prior claims before approving any RMA or refund.
3. Never approve a refund in the first reply.
4. Link the relevant help article by name.$$),
('00000000-0000-0000-0000-000000000002','Kraft&Co','kraftco',
 $$Kraft&Co sells packaging supplies to businesses. Tone: fast, exact, no small talk. Three lines max.
Procedures:
1. Confirm SKU and quantity back to the customer.
2. Quote lead time only from the lead-time table. Never promise a date not in the table.
3. Mention the pallet minimum whenever quantity is within 20% of it.$$),
('00000000-0000-0000-0000-000000000003','Lume','lume',
 $$Lume sells skincare. Tone: warm, reassuring, plain language. No medical claims.
Procedures:
1. Never say a product treats or cures anything.
2. Patch-test advice on every reaction complaint.
3. Offer replacement before refund.$$)
on conflict (id) do nothing;

-- ---------------------------------------------------------------- people
insert into profiles (id, full_name, email, role) values
('00000000-0000-0000-0000-000000000011','Marta Ruiz','marta@sellervate.test','team_lead'),
('00000000-0000-0000-0000-000000000012','Nuria Vega','nuria@sellervate.test','team_lead'),
('00000000-0000-0000-0000-000000000021','Dani Ortega','dani@sellervate.test','specialist'),
('00000000-0000-0000-0000-000000000022','Iker Sanz','iker@sellervate.test','specialist'),
('00000000-0000-0000-0000-000000000023','Leo Marín','leo@sellervate.test','specialist')
on conflict (id) do nothing;

-- ------------------------------------------------------------ membership
-- Cross-assigned on purpose: this is what makes isolation testable.
-- Marta leads Voltaire + Kraft&Co but NOT Lume, so a lead who is not a member
-- of a brand does not see it either. Dani works Voltaire + Kraft&Co, so the
-- same specialist appears under two different voices.
insert into brand_members (brand_id, user_id, role) values
('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','team_lead'),
('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000011','team_lead'),
('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000012','team_lead'),
('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021','specialist'),
('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','specialist'),
('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000022','specialist'),
('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000022','specialist'),
('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000023','specialist')
on conflict do nothing;

-- --------------------------------------------------------------- replies
-- 20 replies that already went out. Read-only in V1.
-- sent_at is always relative to now(), never an absolute date, so the queue
-- reads "yesterday" no matter when this is reset.
-- Voice check: read the reply_text without the brand column and you should
-- still know which brand it is.
insert into replies (id, brand_id, specialist_id, sent_at, channel, customer_message, reply_text) values

-- ==== Voltaire · electric scooters · calm, technical, confident ==========

-- 101 · THE BAD ONE. Refunds on the first reply, asks for no error code and no
-- mileage, and tells a customer holding his second unit that this is his first
-- problem. Nothing here needs a technical reader to see it is wrong.
('00000000-0000-0000-0000-000000000101',
 '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021',
 now() - interval '1 day 3 hours', 'shopify',
 $$Bought the V2 Pro back in March. It won't charge at all now — I plug it in, no light on the charger, nothing on the display. This is the second unit you've sent me and honestly I'm losing patience.$$,
 $$Hi — so sorry about that. A V2 Pro that won't charge is always a dead battery, and the battery is sealed, so the scooter is basically scrap at that point, nothing we can fix. I've gone ahead and refunded you in full, you should see it back in 3–5 business days. I checked and this is the first problem you've had with us, so no worries at all! You can keep the scooter, no need to send anything back.$$),

-- 102 · textbook: diagnose first, code + mileage, article by name.
('00000000-0000-0000-0000-000000000102',
 '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021',
 now() - interval '1 day 7 hours', 'shopify',
 $$My V2 City died on me halfway to work this morning. The display showed something for a second and then went black.$$,
 $$Thanks for the detail — a mid-ride cut-out on the V2 City is almost always one of three things, and the code on the display tells us which. Can you send me the code that appeared before it went black? It's an E followed by two digits, top right of the screen. I'd also like the current mileage, which comes up if you hold the mode button for three seconds. If it turns out to be E-07 you can skip ahead and follow "Charging faults and the E-07 code" in the help centre — that one is usually the charger handshake and clears without a service visit. Send me those two numbers and I'll tell you exactly where we stand.$$),

-- 103 · right answer, but the fourth sentence should have been three.
('00000000-0000-0000-0000-000000000103',
 '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021',
 now() - interval '2 days 4 hours', 'email',
 $$The brake lever on my Rove feels spongy. Is that normal at 400km?$$,
 $$A spongy lever on the Rove at 400 km is usually the pads bedding in and the cable wanting a quarter turn at the adjuster, not a failure. Before you touch anything, tell me the mileage on the display and whether you've seen an E-22 — that code would point at the sensor rather than the cable. If there's no code, the adjuster is the barrel nut just above the caliper, and "Brake pad replacement on the V2 Pro" covers the same part on the Rove. Do it with the scooter off the ground and the power off, turn the barrel a quarter turn anticlockwise, then spin the wheel and squeeze the lever a few times to check the pad clears the disc cleanly, and if it still feels soft after two or three quarter turns stop there rather than keep going, because past a full turn you start pulling the pads out of alignment permanently and what was a two-minute job at home becomes a workshop visit. Tell me how you get on.$$),

-- 104 · answered a different question: asked about range, replied about charging.
('00000000-0000-0000-0000-000000000104',
 '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021',
 now() - interval '6 days 5 hours', 'shopify',
 $$Thinking of moving up from the City to the V2 Pro. What I actually need to know is how far the Pro goes on one charge with a 90kg rider and a hilly commute — the 60km on the site feels optimistic.$$,
 $$Good question, and the honest answer is that it depends a lot on how you charge it. The V2 Pro takes about 4 hours 20 from empty on the stock 3 A charger, and there's a 5 A fast charger sold separately that brings that under three hours. You can leave it on overnight without hurting the pack — the BMS stops taking current at 100% by itself. One thing worth knowing: below about 5 °C the pack refuses to charge at all and the display shows E-11, so if it lives in an unheated garage over winter, bring it inside an hour before you plug it in. "Charging faults and the E-07 code" in the help centre has the full table if you want the detail.$$),

-- 105 · correct and well diagnosed, but never mentions that firmware 4.2 fixed
-- exactly this reading bug — the customer will be back.
('00000000-0000-0000-0000-000000000105',
 '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021',
 now() - interval '9 days 2 hours', 'email',
 $$Speedo on my V2 Pro jumps around — reads 12, then 31, then back down. Motor itself feels completely normal.$$,
 $$A speed reading that jumps on the V2 Pro is nearly always the hall sensor connector at the rear axle working loose rather than the motor, which fits the motor feeling normal to you. Send me the mileage and tell me whether an E-12 has ever come up, because E-12 would mean the sensor has actually failed rather than just backed out of its housing. If there's no code, unplug and reseat the three-pin connector where the cable enters the rear fork — "Speed sensor faults on the V2 range" walks through it with photos and it's a one-minute job. Reseat it, ride 200 metres, and tell me whether the number settles.$$),

-- 106 · solid.
('00000000-0000-0000-0000-000000000106',
 '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021',
 now() - interval '12 days 6 hours', 'shopify',
 $$Can I ride the Rove in the rain? The dealer said yes, the manual says IP54, and I don't know what that means in practice.$$,
 $$IP54 on the Rove means splashes and wet road spray, not standing water — riding home in a downpour is fine, riding through a flooded underpass or hosing it down afterwards is not. In practice the limit is the charge port: keep the rubber flap shut while you ride and let the deck dry before you plug in, because water bridging those pins is the one failure the rating doesn't cover. If you ride wet often, look into the port every couple of months for green residue, and send me the mileage if an E-07 ever shows up after a wet ride. "Riding in wet weather" in the help centre has the drying routine.$$),

-- 107–109 · unreviewed, all sent yesterday: queue material for Marta.
('00000000-0000-0000-0000-000000000107',
 '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021',
 now() - interval '1 day 1 hour', 'shopify',
 $$Ordered a V2 Pro on the 3rd. Tracking hasn't moved since Tuesday and I'm starting to wonder if it's lost.$$,
 $$I've pulled the order up — your V2 Pro left our Zaragoza warehouse on Tuesday and the carrier scanned it into the Madrid hub the same night, so it is moving even though the public tracking page hasn't caught up. That gap on their overnight leg is normal and usually clears inside 48 hours. If there's still no scan by Friday morning I'll open a trace and ship you a replacement from stock rather than wait for it to resolve itself. Nothing for you to do in the meantime.$$),

('00000000-0000-0000-0000-000000000108',
 '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021',
 now() - interval '1 day 5 hours', 'email',
 $$Straight question: when the battery on the V2 Pro wears out, can it be replaced, or am I buying a whole new scooter?$$,
 $$It's replaceable — four bolts under the deck and one connector, and we sell the pack as a service part precisely so you aren't buying a scooter twice. Expect roughly 800 full cycles before capacity settles around 80% of new, which for most riders is three to four years. When you get there, send us the mileage and any code on the display, because a tired pack and a failed BMS board look identical from the saddle and we'd rather not swap the wrong part. "Battery health and when to replace the pack" in the help centre has the cycle chart.$$),

('00000000-0000-0000-0000-000000000109',
 '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021',
 now() - interval '1 day 9 hours', 'shopify',
 $$Left my Rove outside overnight in December and now it won't wake up at all. Display completely dead.$$,
 $$A Rove that won't wake after a cold night is usually the BMS holding the pack in low-temperature lockout rather than anything broken — below about −5 °C it refuses to discharge until the cells come back up. Bring it indoors, leave it at room temperature for four hours, and don't plug it in during that time. Then hold the power button for five seconds. If the display comes up, note the mileage and any E- code before you ride it anywhere. If it's still dead after that, tell me and we'll treat it as a pack fault rather than weather.$$),

-- ==== Kraft&Co · B2B packaging · fast, exact, no small talk, three lines =====

-- 201 · exact and correct, but 520 is inside 20% of the 640 pallet minimum and
-- nobody said so. The customer writes back tomorrow.
('00000000-0000-0000-0000-000000000201',
 '00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000022',
 now() - interval '1 day 2 hours', 'email',
 $$Need 520 of the KC-2214 double-wall for a promo run. When can you get them to us?$$,
 $$520 × KC-2214 double-wall confirmed. Lead time from the table is 5 working days, so ordered today that's with you a week on Monday. Confirm and I'll release it.$$),

-- 202 · Dani writing Kraft&Co in his Voltaire voice. Right answer, wrong brand.
('00000000-0000-0000-0000-000000000202',
 '00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021',
 now() - interval '1 day 6 hours', 'email',
 $$Quick one — is KC-1180 the 350×250 mailer or the 300×220?$$,
 $$Hi there, thanks so much for getting in touch, and I hope your week is off to a good start! I completely understand how confusing it is when two mailer sizes sit that close together in the catalogue — you are honestly not the first person to ask me this, so please don't worry about it for a second. To answer your question: KC-1180 is our 350 × 250 kraft mailer, and the 300 × 220 you're thinking of is KC-1175, which sits directly above it on the same page. I know it's frustrating when the numbering doesn't make that obvious at a glance, and I've made a note to pass that along to the catalogue team, because I really do think you've got a point. Do let me know if there's anything else at all I can help with — I'm always happy to talk options through. Have a lovely rest of your day!$$),

-- 203 · the house voice, exactly.
('00000000-0000-0000-0000-000000000203',
 '00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000022',
 now() - interval '2 days 3 hours', 'email',
 $$Can we get 1,200 KC-3300 pallet wrap and 40 boxes of KC-0455 void fill on one delivery?$$,
 $$1,200 × KC-3300 and 40 × KC-0455 confirmed, both stock lines. Table lead time is 5 working days for both, so they go out together on one pallet. Confirm and I'll release it today.$$),

('00000000-0000-0000-0000-000000000204',
 '00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000022',
 now() - interval '5 days 4 hours', 'email',
 $$Do you print the KC-2214 with our logo? One colour, nothing fancy.$$,
 $$Yes — KC-2214 takes single-colour flexo on one face. Printed lead time from the table is 12 working days and the printed minimum is 640 units, one full pallet. Send artwork as vector and I'll come back with the plate cost.$$),

-- 205 · same Dani as 202, this time pitch-perfect. Voice is learnable, and the
-- seed has to show that or the coaching story is hollow.
('00000000-0000-0000-0000-000000000205',
 '00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021',
 now() - interval '8 days 7 hours', 'email',
 $$We're 30 short on the KC-1180 from last week's delivery. Invoice says 500, we counted 470.$$,
 $$30 × KC-1180 short confirmed — pick weight against the manifest backs you up, so that one's on us. Replacement 30 goes out on tomorrow's van, no charge and nothing to return. Stock line, so the 5-working-day table time doesn't apply to a shortfall.$$),

-- 206 · promises the 11th. Printed lead time is 12 working days (see 204), so
-- that date is not in the table and cannot be met.
('00000000-0000-0000-0000-000000000206',
 '00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000022',
 now() - interval '11 days 5 hours', 'email',
 $$We've got a trade show on the 14th. Can you get 800 KC-2214 printed with our logo onto the stand by the 12th?$$,
 $$800 × KC-2214 printed, single colour, confirmed — that's over the 640 pallet minimum so no small-run surcharge. I can have those with you by the 11th, a day clear of your deadline. Get me the artwork today and I'll lock the slot.$$),

-- 207–208 · unreviewed.
('00000000-0000-0000-0000-000000000207',
 '00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000022',
 now() - interval '1 day 4 hours', 'email',
 $$What's the pallet minimum on KC-0455?$$,
 $$KC-0455 pallet minimum is 480 boxes. Under that it ships as loose cartons and picks up an £18 handling line per order. Tell me the quantity you're after and I'll confirm which side of it you land.$$),

('00000000-0000-0000-0000-000000000208',
 '00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021',
 now() - interval '1 day 8 hours', 'email',
 $$Need to change the delivery address on order 44812 — we're mid warehouse move.$$,
 $$Order 44812 hasn't been picked yet, so yes. Send the new address and a site contact number and I'll amend it before tonight's cut-off. Lead time is unchanged at 5 working days from the original order date.$$),

-- ==== Lume · skincare · warm, plain, no medical claims =====================

('00000000-0000-0000-0000-000000000301',
 '00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000023',
 now() - interval '1 day 10 hours', 'amazon',
 $$I've been using the Overnight Repair Serum for about two weeks and my cheeks have gone red and a bit flaky. Should I stop?$$,
 $$I'm sorry your skin's having a rough time of it — that sounds uncomfortable, and your instinct to pause is the right one. Redness and flaking in the first couple of weeks is usually skin objecting to how often something is being used rather than to the serum itself, so I'd leave it off for a week and keep to just the Gentle Cleanser and the Barrier Cream while things calm down. When you feel ready to try again, patch-test first — a little on the inside of your forearm, left for 24 hours, and see how that patch behaves before it goes anywhere near your face. If it's happy, build back up slowly, two nights a week rather than every night. And if you'd rather not carry on with it at all, just say and I'll send you a Barrier Cream in its place, no need to send anything back.$$),

-- 302–303 · unreviewed. Lume stays sparse on purpose so Nuria meets the
-- near-empty states the UI branches have to design for.
('00000000-0000-0000-0000-000000000302',
 '00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000022',
 now() - interval '3 days 6 hours', 'amazon',
 $$Is the Daily SPF 30 meant to work under makeup? Mine pills every single time.$$,
 $$Pilling is such an annoying one, and nine times out of ten it's timing rather than the product. Daily SPF 30 wants a minute or two to settle before anything goes on top — patting it in and then counting to sixty before your foundation sorts it for most people. It also helps to use a bit less than feels right in the first layer and add a second thin one after, rather than one thick layer. If it still pills after that, tell me what you're putting on underneath and I'll have a look at the order things are going on in.$$),

('00000000-0000-0000-0000-000000000303',
 '00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000023',
 now() - interval '1 day 11 hours', 'shopify',
 $$Ordered the Barrier Cream on Friday and it still says processing. I'm away from Thursday.$$,
 $$I've had a look and your Barrier Cream is packed and sitting on today's collection, so "processing" is just our label not keeping up with the shelf. It should reach you Tuesday, Wednesday at the outside, which gets it to you before Thursday. If it hasn't turned up by Wednesday morning, message me here and I'll send a second one on to wherever you're staying rather than leave you without it. Have a good trip.$$)

on conflict (id) do nothing;

-- --------------------------------------------------------------- reviews
-- 13 of the 20 replies are reviewed; the other 7 are the queue.
-- Voltaire and Kraft&Co are Marta's (...0011), Lume is Nuria's (...0012) —
-- which is the membership table doing its job, not a coincidence.
-- Review id = 0001 + the reply's suffix, so ...0001101 reviews ...0000101.
-- created_at sits a few hours after the reply's sent_at so trends have a
-- real time axis rather than thirteen rows stamped now().
insert into reviews (id, reply_id, reviewer_id, score, severity, categories, comment, created_at, acknowledged_at) values

-- ==== Voltaire · reviewed by Marta ======================================

('00000000-0000-0000-0000-000000001101','00000000-0000-0000-0000-000000000101',
 '00000000-0000-0000-0000-000000000011', 1, 'critical',
 '{no_order_history_check,wrong_facts}',
 $$Two separate failures in one reply. You refunded on first contact, which the procedure rules out, and you told a customer holding his second unit that this was his first problem — the order history was one click away. "Always a dead battery, basically scrap" is also just not true, and it is exactly the kind of line the brand hears repeated back to them. No error code, no mileage, nothing to act on. Read this one back before your next Voltaire shift.$$,
 now() - interval '1 day 1 hour', null),

('00000000-0000-0000-0000-000000001102','00000000-0000-0000-0000-000000000102',
 '00000000-0000-0000-0000-000000000011', 5, 'none', '{}',
 $$This is the one to copy. Code and mileage asked for in the same breath, the article named instead of dropped in blind, and he knows what happens next. Keep doing exactly this.$$,
 now() - interval '1 day 4 hours', now() - interval '12 hours'),

('00000000-0000-0000-0000-000000001103','00000000-0000-0000-0000-000000000103',
 '00000000-0000-0000-0000-000000000011', 4, 'none', '{}',
 $$Diagnosis is right and the article reference is correct. The fourth sentence is three sentences wearing a coat — split it. Nothing wrong here, just make it readable at 7am on a phone.$$,
 now() - interval '2 days 1 hour', null),

('00000000-0000-0000-0000-000000001104','00000000-0000-0000-0000-000000000104',
 '00000000-0000-0000-0000-000000000011', 2, 'minor', '{answered_wrong_question}',
 $$Everything you wrote is accurate and none of it answers what he asked. He wanted range with a 90 kg rider on hills and got the charging table. Re-read the last line of the customer message before you start typing.$$,
 now() - interval '6 days 2 hours', null),

('00000000-0000-0000-0000-000000001105','00000000-0000-0000-0000-000000000105',
 '00000000-0000-0000-0000-000000000011', 3, 'none', '{incomplete}',
 $$Correct diagnosis and clean instructions. You left out that firmware 4.2 fixed this exact reading bug, so he will reseat the connector, see it again and write back. Not wrong — unfinished.$$,
 now() - interval '8 days 22 hours', null),

('00000000-0000-0000-0000-000000001106','00000000-0000-0000-0000-000000000106',
 '00000000-0000-0000-0000-000000000011', 4, 'none', '{}',
 $$Good plain explanation of IP54 without overpromising, and the charge-port warning is the part that actually saves the scooter. Ask for the mileage up front next time rather than conditionally.$$,
 now() - interval '12 days 2 hours', null),

-- ==== Kraft&Co · reviewed by Marta ======================================

('00000000-0000-0000-0000-000000001201','00000000-0000-0000-0000-000000000201',
 '00000000-0000-0000-0000-000000000011', 3, 'none', '{incomplete}',
 $$Lead time is right and it came from the table. But 520 against a 640 pallet minimum is inside the 20% band, so the pallet line belonged in this reply — he comes back asking, and that is a second touch we did not need to spend.$$,
 now() - interval '22 hours', null),

('00000000-0000-0000-0000-000000001202','00000000-0000-0000-0000-000000000202',
 '00000000-0000-0000-0000-000000000011', 2, 'minor', '{tone_off_brand}',
 $$Right answer, wrong company. Five paragraphs of warmth for a SKU lookup that needed one line, and Kraft&Co asked us specifically for three lines and no small talk — this is the thing they notice and mention. You write this voice well for Voltaire. Check which brand you are in before you start typing.$$,
 now() - interval '1 day 2 hours', null),

('00000000-0000-0000-0000-000000001203','00000000-0000-0000-0000-000000000203',
 '00000000-0000-0000-0000-000000000011', 5, 'none', '{}',
 $$Textbook Kraft&Co. Both SKUs and both quantities confirmed back, lead time from the table, one action to close it. Three lines.$$,
 now() - interval '2 days', null),

('00000000-0000-0000-0000-000000001204','00000000-0000-0000-0000-000000000204',
 '00000000-0000-0000-0000-000000000011', 4, 'none', '{}',
 $$Clean. Print spec, table lead time, minimum and next step inside three lines. A plate cost range would have let him budget without writing again.$$,
 now() - interval '5 days 1 hour', null),

('00000000-0000-0000-0000-000000001205','00000000-0000-0000-0000-000000000205',
 '00000000-0000-0000-0000-000000000011', 5, 'none', '{}',
 $$Same person as the KC-1180 mailer reply, completely different execution. Shortfall accepted without an argument, the fix is dated, and you pre-empted the lead-time question instead of waiting for it. This is the voice.$$,
 now() - interval '8 days 3 hours', null),

('00000000-0000-0000-0000-000000001206','00000000-0000-0000-0000-000000000206',
 '00000000-0000-0000-0000-000000000011', 1, 'critical', '{wrong_facts}',
 $$The 11th is not in the table. Printed is 12 working days and there is no expedite path on flexo, so that date could not be met at the moment you sent it — and he has booked a trade show stand around it. Never quote a date the table does not give you. If the answer is no, the reply is no.$$,
 now() - interval '11 days 1 hour', null),

-- ==== Lume · reviewed by Nuria ==========================================

('00000000-0000-0000-0000-000000001301','00000000-0000-0000-0000-000000000301',
 '00000000-0000-0000-0000-000000000012', 4, 'none', '{}',
 $$Warm without being vague, and you gave her the patch test and the replacement before anyone had to mention money. No medical language anywhere near it. Only thing missing is asking her to tell us how it goes, so we can close the loop.$$,
 now() - interval '1 day 6 hours', null)

on conflict (id) do nothing;
