import fitz, re, os, traceback
src = r"C:\projects_test\cooker\nisr\data\raw\publications\LFS_2022_annual_report.pdf"
out = r"C:\projects_test\cooker\nisr\data\processed\LFS_2022_annual_report.txt"
try:
    d = fitz.open(src)
    print("pages:", len(d))
    with open(out, "w", encoding="utf-8") as t:
        for i, p in enumerate(d, 1):
            t.write(f"\n=== PAGE {i} ===\n" + p.get_text())
    print("saved", os.path.getsize(out), "bytes")
except Exception:
    traceback.print_exc()
txt = open(out, encoding="utf-8").read() if os.path.exists(out) else ""
pages = txt.split("=== PAGE ")
pat = {
 "youth unemployment": r"youth.{0,60}(unemploy|NEET|not in employment)",
 "unemployment rate": r"unemployment rate",
 "by district": r"(district).{0,40}(employment|unemploy|labour force participation)",
 "industry/sector": r"(agriculture|industry|services).{0,60}\d+(\.\d+)?\s*%",
 "education of unemployed": r"(secondary|tertiary|TVET|university).{0,80}(unemploy|employed)",
 "skills/underutilisation": r"(underutili|time-related|potential labour force)",
}
for k, rx in pat.items():
    print(f"\n[{k}]")
    n = 0
    for pg in pages[1:]:
        num = pg.split(" ===")[0]
        for line in pg.splitlines():
            if re.search(rx, line, re.I) and re.search(r"\d", line) and 20 < len(line) < 230:
                print(f"  p{num}: {line.strip()}"); n += 1
                if n >= 8: break
        if n >= 8: break
