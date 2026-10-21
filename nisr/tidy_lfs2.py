import pandas as pd, re, os, sys, traceback
raw  = r"C:\projects_test\cooker\nisr\data\raw\publications"
proc = r"C:\projects_test\cooker\nisr\data\processed"
pd.set_option("display.width", 250)
try:
    x = pd.ExcelFile(os.path.join(raw, "LFS_2026Q3_tables.xlsx"))
    rows = []
    for s in x.sheet_names[1:]:
        df = x.parse(s, header=None)
        yr = qt = None
        for i in range(min(8, len(df))):
            num = pd.to_numeric(df.iloc[i, 1:], errors="coerce")
            if yr is None and ((num > 2018) & (num < 2031)).sum() > 5: yr = i
            if qt is None and df.iloc[i, 1:].astype(str).str.fullmatch(r"Q[1-4]").sum() > 5: qt = i
        if yr is None or qt is None:
            print("SKIP", s, "yr/qt not found"); continue
        cols = {}
        for c in range(1, df.shape[1]):
            y = pd.to_numeric(df.iloc[yr, c], errors="coerce"); q = str(df.iloc[qt, c]).strip()
            if pd.notna(y) and re.fullmatch(r"Q[1-4]", q): cols[c] = f"{int(y)}{q}"
        grp = ""
        for r in range(qt + 1, df.shape[0]):
            lab = df.iloc[r, 0]
            if not isinstance(lab, str): continue
            vals = pd.to_numeric(df.iloc[r, 1:], errors="coerce")
            if vals.notna().sum() == 0:
                grp = lab.strip(); continue
            for c, p in cols.items():
                v = pd.to_numeric(df.iloc[r, c], errors="coerce")
                if pd.notna(v): rows.append((s, grp, lab.strip(), p, float(v)))
    t = pd.DataFrame(rows, columns=["sheet", "group", "indicator", "period", "value"])
    t.to_csv(os.path.join(proc, "LFS_quarterly_tidy.csv"), index=False, encoding="utf-8")
    print("tidy rows:", len(t), "| sheets:", t.sheet.nunique(), "| periods:", t.period.min(), "->", t.period.max())
    for s in ("LFIndicatorsYouthAdult", "LFIndicatorsEduc", "EconomicActivitySex", "EconomicActivityUrRur", "OccupationsSex", "OccupationsUrRur", "EmployedEducaSex", "StatusInEmploymentSex"):
        d = t[t.sheet == s]
        if d.empty: print("\n#####", s, "EMPTY"); continue
        p = d.pivot_table(index=["group", "indicator"], columns="period", values="value", aggfunc="first")
        keep = [c for c in ("2024Q3", "2025Q3", "2026Q2", "2026Q3") if c in p.columns]
        print(f"\n##### {s}")
        print(p[keep].round(1).head(45).to_string(max_colwidth=55))
except Exception:
    traceback.print_exc(file=sys.stdout)

try:
    e = pd.ExcelFile(os.path.join(raw, "EICV7_education_tables.xlsx"))
    print("\n##### EICV7 education sheets:", len(e.sheet_names))
    for s in e.sheet_names[:70]:
        d = e.parse(s, header=None, nrows=6)
        ttl = next((v for v in d.values.flatten() if isinstance(v, str) and len(v) > 10), "")
        print(f"  {s:<24} {ttl[:110].strip()}")
except Exception:
    traceback.print_exc(file=sys.stdout)

try:
    tx = open(os.path.join(proc, "LFS_August_2026_report.txt"), encoding="utf-8").read()
    pages = {int(m.group(1)): m.group(2) for m in re.finditer(r"=== PAGE (\d+) ===\n(.*?)(?=\n=== PAGE |\Z)", tx, re.S)}
    for pg in (16, 17, 18, 19, 41, 42):
        print(f"\n##### REPORT PAGE {pg}"); print(re.sub(r"\s*\n\s*", " ", pages.get(pg, ""))[:1500])
except Exception:
    traceback.print_exc(file=sys.stdout)
