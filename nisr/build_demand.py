import pandas as pd, os
proc = r"C:\projects_test\cooker\nisr\data\processed"
t = pd.read_csv(os.path.join(proc, "LFS_quarterly_tidy.csv")).fillna("")
a = t[(t.sheet == "EconomicActivitySex") & (t.group == "")]
def share(prefix, per):
    r = a[a.indicator.str.startswith(prefix) & (a.period == per)]
    return float(r.value.iloc[0]) if len(r) else None
tot = {p: float(a[(a.indicator == "Employed population aged 16+") & (a.period == p)].value.iloc[0]) for p in ("2024Q3", "2025Q3", "2026Q3")}
M = [
 ("farming", "Agriculture forestry"), ("construction", "Construction"), ("driving", "Transportationa"),
 ("sales", "Whole sale"), ("bookkeeping", "Financial and insurance"), ("cooking", "Accommodation"),
 ("tourism", "Accommodation"), ("teaching", "Education"), ("webapp", "Information and communication"),
 ("media", "Information and communication"), ("journalism", "Information and communication"),
 ("repair", "Other services"), ("hair", "Other services"), ("tailoring", "Manufacturing"),
 ("interpreting", "Professional, scientific"),
]
rows = []
for pid, pre in M:
    s24, s25, s26 = (share(pre, p) for p in ("2024Q3", "2025Q3", "2026Q3"))
    e25, e26 = s25 * tot["2025Q3"] / 100, s26 * tot["2026Q3"] / 100
    rows.append(dict(path_id=pid, lfs_sector=pre, share_2024Q3=s24, share_2025Q3=s25, share_2026Q3=s26,
        jobs_2025Q3=round(e25), jobs_2026Q3=round(e26), jobs_change_pct=round((e26 / e25 - 1) * 100, 1),
        source="NISR LFS Q3 2026 tables, EconomicActivitySex (all sexes); path mapping = our assumption"))
d = pd.DataFrame(rows)
mx = d.share_2026Q3.max()
d["demand_0_1"] = (d.share_2026Q3 / mx).round(3)
d.to_csv(os.path.join(proc, "demand_by_path.csv"), index=False)
print(d[["path_id", "lfs_sector", "share_2026Q3", "jobs_2026Q3", "jobs_change_pct", "demand_0_1"]].to_string(index=False))
