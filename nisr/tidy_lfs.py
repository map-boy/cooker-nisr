import pandas as pd, re, os
raw = r"C:\projects_test\cooker\nisr\data\raw\publications"
proc = r"C:\projects_test\cooker\nisr\data\processed"
x = pd.ExcelFile(os.path.join(raw, "LFS_2026Q3_tables.xlsx"))

def hdr(df):
    # find year row and quarter row
    yr = qt = None
    for i in range(0, 8):
        row = df.iloc[i].tolist()
        if sum(isinstance(v,(int,float)) and 2018 < v < 2030 for v in row[1:]) > 5 and yr is None: yr = i
        if sum(isinstance(v,str) and re.fullmatch(r"Q[1-4]", v.strip()) for v in row[1:]) > 5 and qt is None: qt = i
    return yr, qt

tidy = []
for s in x.sheet_names[1:]:
    df = x.parse(s, header=None)
    yr, qt = hdr(df)
    if yr is None or qt is None: continue
    cols = {}
    for c in range(1, df.shape[1]):
        try: cols[c] = f"{int(df.iloc[yr,c])}{df.iloc[qt,c].strip()}"
        except Exception: pass
    for r in range(qt+1, df.shape[0]):
        lab = df.iloc[r,0]
        if not isinstance(lab, str): continue
        for c, q in cols.items():
            v = df.iloc[r,c]
            if isinstance(v,(int,float)) and v == v:
                tidy.append((s, df.iloc[1,0] if isinstance(df.iloc[1,0],str) else "", lab.strip(), q, float(v)))
t = pd.DataFrame(tidy, columns=["sheet","group","indicator","period","value"])
t.to_csv(os.path.join(proc, "LFS_quarterly_tidy.csv"), index=False, encoding="utf-8")
print("tidy rows:", len(t), "| sheets:", t.sheet.nunique(), "| periods:", t.period.min(), "->", t.period.max())

def show(sheet, maxrows=60):
    d = t[t.sheet==sheet]
    p = d.pivot_table(index=["group","indicator"], columns="period", values="value", aggfunc="first")
    keep = [c for c in ("2024Q3","2025Q3","2026Q2","2026Q3") if c in p.columns]
    print(f"\n##### {sheet}")
    print(p[keep].round(1).head(maxrows).to_string(max_colwidth=60))
for s in ("LFIndicatorsYouthAdult","LFIndicatorsEduc","EconomicActivitySex","EconomicActivityUrRur","OccupationsSex","OccupationsUrRur","EmployedEducaSex","StatusInEmploymentSex","LFIndicatorsAge"):
    show(s, 48)

# EICV7 education workbook map
e = pd.ExcelFile(os.path.join(raw, "EICV7_education_tables.xlsx"))
print("\n##### EICV7 education sheets:", len(e.sheet_names))
for s in e.sheet_names[:60]:
    d = e.parse(s, header=None)
    ttl = next((v for v in d.iloc[:5].values.flatten() if isinstance(v,str) and len(v)>10), "")
    print(f"  {s:<22} {str(d.shape):<10} {ttl[:110].strip()}")
