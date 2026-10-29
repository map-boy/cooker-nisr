# Cooker - find what you can do, how to start, and why

**NISR 2026 Big Data Hackathon - Track 3: Open Innovation**

Cooker helps young Rwandans discover work paths that fit them, then gives small tested first steps (20 min/day, free) instead of a job-title guess. It runs in the browser in Kinyarwanda, English, French and Swahili (Arabic and Luganda fall back to English until reviewed), works offline as a PWA, and needs no typing.

**Live demo:** https://cooker-public.vercel.app

**Repository:** https://github.com/map-boy/cooker-nisr

## How it works
1. Language, consent, 8 context taps (age band, situation, data/device, money, time).
2. Joy map (what you really do) + adaptive yes/no/forced-choice cards; stops by rule when the answer is stable.
3. 3 short mini-games (focus, reasoning, memory) add behavioural evidence.
4. Ranking = interest + style + motives + evidence + reality, weighted by life stage, **plus a NISR labour-demand factor** (LFS Q3 2026: sector share of workers and one-year job change).
5. The result explains "because you said..." and starts a 5-station Journey (watch, copy, make, show, ask) with "not yet" barrier fixes.

Full algorithm: [COOKER.md](COOKER.md). Honest limits: weights are expert starting values, not validated; the path-to-sector mapping is our assumption (see nisr/docs).

## Run

    npm install
    npm run dev
    npm run typecheck && npm run lint:content && npm run sim && npm run build

The engine (packages/engine) is pure and deterministic (seeded). tools/simulate.ts runs persona tests. Games accept ?seed=123 for repeatable sequences.

## NISR data used

| Dataset | Used for |
|---|---|
| Labour Force Survey Q3 2026 tables and August 2026 report | sector share of workers, one-year job change (demand factor), youth/adult and education indicators |
| LFS 2022 annual report | context and definitions |
| EICV7 documentation, FinScope 2024 report | planned district-level and access context (not yet in ranking) |

Processed tables: nisr/data/processed. Build scripts: nisr/*.py. Checked figures: nisr/docs/verified_facts.md.

## AI-tools disclosure
Code, documentation and data-parsing scripts were drafted with Claude (Anthropic) and run, tested and reviewed by the team. Kinyarwanda, French and Swahili texts are drafts pending native-speaker review.

## Team
Mugisha Alain Paisible (ULK, Data Science; Rwandan citizen) and TEAMMATE_NAME (UNIVERSITY, PROGRAMME; Rwandan citizen: YES/NO).