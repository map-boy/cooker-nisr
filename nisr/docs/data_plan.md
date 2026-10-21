# DATA PLAN

Needed table -> source -> feeds
- Employment by sector, age, sex, district      -> LFS annual report / microdata -> path.market.demand
- Youth unemployment, NEET, underutilisation    -> LFS                           -> problem statement + dashboard
- Household income, poverty by district         -> EICV                          -> barrier/capital defaults + dashboard
- Population 15-34 by district                  -> Census 2022 district profiles -> dashboard denominators
- Financial access (optional)                   -> FinScope/other if available   -> Track 2 angle, optional

Microdata: free registration on https://microdata.statistics.gov.rw (login/register pages exist); some studies need an access request. Read the microdata release policy first.
Mapping: sector (ISIC groups) -> Cooker path ids. Keep a CSV: path_id, sector_group, source_table, year, value.
Rule: every demand number carries source + year. Never invent values.
