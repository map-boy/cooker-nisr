# PROBLEM STATEMENT - Cooker Pathfinder (numbers: NISR Labour Force Survey, Aug 2026 / Q3)

1. The problem
1,038,707 young Rwandans (27.5% of 16-30 year-olds) are not in employment, education or training. For young women it is 35.2%, in rural areas 30.3%.
Youth unemployment is 18.8% against 13.1% for adults, and overall unemployment rose from 13.4% to 15.6% in one year.
Labour underutilisation is 61.8%: more than half of the extended labour force is unemployed, under-employed or available but not searching.
Jobs are concentrated: 48.9% of workers are in elementary occupations and 34.2% in agriculture, so most young people have no guidance on other paths that exist near them.
Education alone does not solve it: unemployment is 22.8% among upper-secondary leavers, higher than among primary leavers (15.2%).
The missing piece is personal fit plus local demand: people choose paths without knowing what they are good at or where jobs are growing.

2. Our solution
A free, Kinyarwanda-first mobile tool. Short taps and mini-games (focus, reasoning, memory) build an interest and thinking-skills profile.
The engine ranks 15 paths using that profile AND NISR labour-market demand (sector share and job change from the LFS), then gives a first 20-minute step.
An aggregated, anonymised dashboard shows talent supply against demand for planners.

3. Why it can work
92.2% of 16-30 year-olds have basic digital skills (LFS Table B.4): a phone-first tool reaches the group at risk.
Engine runs in the browser: works with weak data, no per-user server cost, 6 languages, privacy-first, under-18 safe.

4. Alignment
NST2 / Vision 2050: Vision 2050 and NST2 youth employment and skills priorities.
Track 3 Open Innovation.

5. Honest limits
Profiles are starting hypotheses, not IQ or clinical tests. Path-to-sector mapping is our assumption and is documented in data/processed/demand_by_path.csv.
District-level demand needs LFS microdata access (requested). Pilot with 30+ users planned to calibrate weights.
