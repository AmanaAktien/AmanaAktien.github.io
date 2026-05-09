import { useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
//  DATENQUELLE: Yahoo Finance (kostenlos, öffentlich)
//  via allorigins CORS-Proxy
// ═══════════════════════════════════════════════════════════════
const PROXY = "https://api.allorigins.win/get?url=";

function rv(obj) { return obj?.raw ?? null; }

const fmt = {
  money: (v) => {
    if (v === null || v === undefined || isNaN(v)) return "N/A";
    const abs = Math.abs(v);
    if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (abs >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`;
    if (abs >= 1e6)  return `$${(v / 1e6).toFixed(1)}M`;
    return `$${v.toLocaleString()}`;
  },
  pct: (v, d = 2) =>
    v === null || !isFinite(v) ? "—" : `${v.toFixed(d)}%`,
};

async function fetchYahoo(ticker) {
  const modules = [
    "financialData",
    "defaultKeyStatistics",
    "balanceSheetHistoryQuarterly",
    "incomeStatementHistoryQuarterly",
    "summaryProfile",
  ].join(",");
  const yf = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}&lang=en`;
  const res = await fetch(`${PROXY}${encodeURIComponent(yf)}`);
  if (!res.ok) throw new Error("Netzwerkfehler beim Laden");
  const outer = await res.json();
  const inner = JSON.parse(outer.contents);
  if (inner.quoteSummary?.error)
    throw new Error(inner.quoteSummary.error.description || "Yahoo Finance Fehler");
  const result = inner.quoteSummary?.result?.[0];
  if (!result) throw new Error(`Ticker "${ticker}" nicht gefunden`);
  return result;
}

function extract(d, ticker) {
  const fd = d.financialData || {};
  const ks = d.defaultKeyStatistics || {};
  const sp = d.summaryProfile || {};
  const bs = d.balanceSheetHistoryQuarterly?.balanceSheetStatements?.[0] || {};
  const isQs = d.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];

  // Zinserträge TTM: Summe letzter 4 Quartale
  // Yahoo Finance liefert "interestIncome" wenn das Unternehmen es separat ausweist
  let interestIncomeTTM = null;
  let interestIncomeSource = "nicht ausgewiesen";
  for (const q of isQs.slice(0, 4)) {
    const v = rv(q.interestIncome);
    if (v !== null) {
      interestIncomeTTM = (interestIncomeTTM || 0) + v;
      interestIncomeSource = "Yahoo Finance (4Q TTM)";
    }
  }

  return {
    ticker: ticker.toUpperCase(),
    name: sp.longName || sp.shortName || ticker.toUpperCase(),
    sector: sp.sector || "N/A",
    industry: sp.industry || "N/A",
    marketCap:      rv(ks.marketCap),
    totalDebt:      rv(fd.totalDebt),
    totalCash:      rv(fd.totalCash),
    totalAssets:    rv(bs.totalAssets),
    netReceivables: rv(bs.netReceivables),
    totalRevenue:   rv(fd.totalRevenue),
    interestIncome: interestIncomeTTM,
    interestIncomeSource,
    bsDate:         bs.endDate?.fmt || "letztes Quartal",
    isDate:         isQs[0]?.endDate?.fmt || "letztes Quartal",
  };
}

// ═══════════════════════════════════════════════════════════════
//  SHARIAH-SCREENING: Alle 5 Standards
//  Quellen: AAOIFI, DJIM, FTSE, MSCI, S&P — wie Halal Terminal
// ═══════════════════════════════════════════════════════════════
function buildScreening(m) {
  const { marketCap: mc, totalDebt: d, totalCash: c, totalAssets: ta,
          netReceivables: r, totalRevenue: rev, interestIncome: ii } = m;

  const safe = (num, denom) =>
    num !== null && denom ? (num / denom) * 100 : null;

  const cashPlusRecv = (c !== null && r !== null && ta)
    ? ((c + r) / ta) * 100
    : null;

  const methods = [
    {
      id: "AAOIFI", color: "#00FF88", denom: "Market Cap",
      note: "Strengste Schwellen — GCC/MENA",
      ratios: [
        { label: "Schulden / Market Cap",         val: safe(d, mc),  limit: 30,    key: "debt" },
        { label: "Cash & Deposits / Market Cap",  val: safe(c, mc),  limit: 30,    key: "cash" },
        { label: "Forderungen / Market Cap",      val: safe(r, mc),  limit: 30,    key: "recv" },
        { label: "Zinserträge / Umsatz",          val: safe(ii, rev), limit: 5,   key: "int",
          warn: ii === null },
      ],
    },
    {
      id: "DJIM", color: "#4FC3F7", denom: "24-Mo Ø MCap†",
      note: "Dow Jones — globaler Benchmark",
      ratios: [
        { label: "Schulden / Market Cap",         val: safe(d, mc),  limit: 33,    key: "debt" },
        { label: "Cash & Deposits / Market Cap",  val: safe(c, mc),  limit: 33,    key: "cash" },
        { label: "Forderungen / Market Cap",      val: safe(r, mc),  limit: 33,    key: "recv" },
        { label: "Zinserträge / Umsatz",          val: safe(ii, rev), limit: 5,   key: "int",
          warn: ii === null },
      ],
    },
    {
      id: "FTSE", color: "#FFD700", denom: "Bilanzsumme",
      note: "FTSE Russell — UK / Malaysia",
      ratios: [
        { label: "Schulden / Bilanzsumme",           val: safe(d, ta),      limit: 33, key: "debt" },
        { label: "(Cash + Ford.) / Bilanzsumme",     val: cashPlusRecv,     limit: 50, key: "cr" },
        { label: "Zinserträge / Umsatz",             val: safe(ii, rev),    limit: 5,  key: "int",
          warn: ii === null },
      ],
    },
    {
      id: "MSCI", color: "#FF9800", denom: "Bilanzsumme",
      note: "MSCI Islamic — institutionell",
      ratios: [
        { label: "Schulden / Bilanzsumme",           val: safe(d, ta),      limit: 33.33, key: "debt" },
        { label: "(Cash + Ford.) / Bilanzsumme",     val: cashPlusRecv,     limit: 33.33, key: "cr" },
        { label: "Zinserträge / Umsatz",             val: safe(ii, rev),    limit: 5,     key: "int",
          warn: ii === null },
      ],
    },
    {
      id: "S&P", color: "#E91E63", denom: "36-Mo Ø MCap†",
      note: "S&P Shariah — laxere Cash-Limits",
      ratios: [
        { label: "Schulden / Market Cap",         val: safe(d, mc),  limit: 33,    key: "debt" },
        { label: "Cash / Market Cap",             val: safe(c, mc),  limit: 49,    key: "cash" },
        { label: "Forderungen / Market Cap",      val: safe(r, mc),  limit: 49,    key: "recv" },
        { label: "Zinserträge / Umsatz",          val: safe(ii, rev), limit: 5,   key: "int",
          warn: ii === null },
      ],
    },
  ];

  return methods.map((method) => {
    const ratios = method.ratios.map((rr) => ({
      ...rr,
      pass: rr.val === null ? null : rr.val <= rr.limit,
    }));
    const definedResults = ratios.filter((rr) => rr.pass !== null);
    const overallPass =
      definedResults.length > 0 && definedResults.every((rr) => rr.pass);
    const hasUnknown = ratios.some((rr) => rr.pass === null);
    return { ...method, ratios, pass: overallPass, hasUnknown };
  });
}

// ═══════════════════════════════════════════════════════════════
//  BUSINESS ACTIVITY CHECK (basic — Sektor/Branche)
// ═══════════════════════════════════════════════════════════════
function checkBusiness(sector, industry) {
  const combined = (sector + " " + industry).toLowerCase();
  const failKeywords = [
    "bank", "insur", "alcohol", "gambling", "tobacco",
    "weapon", "defense", "cannabis", "brewery", "distill",
    "porn", "adult", "lottery", "casino", "pork",
  ];
  const flagKeywords = ["financial", "diversified"];
  if (failKeywords.some((k) => combined.includes(k)))
    return { status: "FAIL", color: "#FF3E3E", label: "⚠ NICHT KONFORM" };
  if (flagKeywords.some((k) => combined.includes(k)))
    return { status: "REVIEW", color: "#FFD700", label: "⚠ PRÜFEN" };
  return { status: "PASS", color: "#00FF88", label: "✓ BASIS OK" };
}

// ═══════════════════════════════════════════════════════════════
//  PURIFICATION RATE (Reinigungssatz)
//  = Zinserträge / Umsatz (wie bei Halal Terminal)
// ═══════════════════════════════════════════════════════════════
function purificationRate(metrics) {
  if (metrics.interestIncome === null || !metrics.totalRevenue) return null;
  return (metrics.interestIncome / metrics.totalRevenue) * 100;
}

// ═══════════════════════════════════════════════════════════════
//  HAUPTKOMPONENTE
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [ticker, setTicker] = useState("");
  const [state, setState] = useState({ data: null, loading: false, error: null });

  const run = useCallback(async () => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setState({ data: null, loading: true, error: null });
    try {
      const raw = await fetchYahoo(t);
      const metrics = extract(raw, t);
      const screening = buildScreening(metrics);
      const biz = checkBusiness(metrics.sector, metrics.industry);
      const purRate = purificationRate(metrics);
      setState({
        data: { ticker: t, metrics, screening, biz, purRate },
        loading: false,
        error: null,
      });
    } catch (e) {
      setState({ data: null, loading: false, error: e.message });
    }
  }, [ticker]);

  const S = styles;

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div>
          <span style={S.logo}>AMANA_TERMINAL</span>
          <span style={S.logoSub}> // SHARIAH SCREENER // ECHTE DATEN</span>
        </div>
        <span style={{ color: "#00FF41", fontSize: "0.7rem" }}>
          ● YAHOO FINANCE (KOSTENLOS / ÖFFENTLICH)
        </span>
      </div>

      <div style={S.searchRow}>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="TICKER EINGEBEN  (TSLA · AAPL · MSFT · NKE · SAP)"
          style={S.input}
        />
        <button onClick={run} style={S.btn} disabled={state.loading}>
          {state.loading ? "LÄDT..." : "SCREEN →"}
        </button>
      </div>

      {state.loading && (
        <div style={S.statusMsg}>
          DATEN WERDEN VON YAHOO FINANCE GELADEN...
        </div>
      )}
      {state.error && (
        <div style={{ ...S.statusMsg, color: "#FF3E3E", borderColor: "#FF3E3E" }}>
          FEHLER: {state.error}
        </div>
      )}
      {state.data && <Dashboard {...state.data} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════
function Dashboard({ ticker, metrics, screening, biz, purRate }) {
  const passCount = screening.filter((m) => m.pass).length;
  const overallColor =
    biz.status === "FAIL"
      ? "#FF3E3E"
      : passCount === 5
      ? "#00FF88"
      : passCount >= 3
      ? "#FFD700"
      : "#FF3E3E";

  const overallLabel =
    biz.status === "FAIL"
      ? "NON-COMPLIANT"
      : passCount === 5
      ? "COMPLIANT"
      : passCount >= 3
      ? "FRAGWÜRDIG"
      : "NON-COMPLIANT";

  const S = styles;

  return (
    <div>
      {/* ── Unternehmens-Header ── */}
      <div style={S.companyBanner}>
        <div>
          <div style={S.tickerBig}>{ticker}</div>
          <div style={{ color: "#aaa", fontSize: "0.85rem", marginTop: 4 }}>
            {metrics.name}
          </div>
          <div style={{ color: "#555", fontSize: "0.7rem", marginTop: 2 }}>
            {metrics.sector} · {metrics.industry}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              ...S.overallBadge,
              background: overallColor,
              color: overallColor === "#FFD700" ? "#000" : "#000",
            }}
          >
            {overallLabel}
          </div>
          <div style={{ color: "#555", fontSize: "0.65rem", marginTop: 6 }}>
            {passCount}/5 Standards bestanden
          </div>
          <div
            style={{
              color: biz.color,
              fontSize: "0.65rem",
              marginTop: 3,
              fontWeight: 900,
            }}
          >
            Business: {biz.label}
          </div>
          {purRate !== null && (
            <div style={{ color: "#FFD700", fontSize: "0.65rem", marginTop: 3 }}>
              Reinigungssatz: {fmt.pct(purRate)}
            </div>
          )}
        </div>
      </div>

      {/* ── Rohdaten ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>
          ROHDATEN — QUELLE: YAHOO FINANCE (Bilanz per {metrics.bsDate})
        </div>
        <div style={S.rawGrid}>
          {[
            ["Marktkapitalisierung", fmt.money(metrics.marketCap), ""],
            ["Zinstragende Schulden", fmt.money(metrics.totalDebt), "totalDebt"],
            ["Cash & Äquivalente", fmt.money(metrics.totalCash), "totalCash"],
            ["Bilanzsumme", fmt.money(metrics.totalAssets), `Stand: ${metrics.bsDate}`],
            [
              "Netto-Forderungen",
              fmt.money(metrics.netReceivables),
              `Stand: ${metrics.bsDate}`,
            ],
            ["Umsatz (TTM)", fmt.money(metrics.totalRevenue), "letzten 12 Monate"],
            [
              "Zinserträge (TTM)",
              metrics.interestIncome !== null
                ? fmt.money(metrics.interestIncome)
                : "⚠ nicht ausgewiesen",
              metrics.interestIncomeSource,
            ],
          ].map(([label, val, note]) => (
            <div
              key={label}
              style={{
                ...S.rawCard,
                borderTopColor:
                  val.startsWith("⚠") || val === "N/A" ? "#333" : "#FFD700",
              }}
            >
              <div style={S.rawLabel}>{label}</div>
              <div
                style={{
                  ...S.rawVal,
                  color: val.startsWith("⚠") || val === "N/A" ? "#444" : "#fff",
                }}
              >
                {val}
              </div>
              {note && <div style={S.rawNote}>{note}</div>}
            </div>
          ))}
        </div>
        {metrics.interestIncome === null && (
          <div style={S.warningBox}>
            ⚠ Zinserträge wurden von Yahoo Finance nicht separat ausgewiesen. Das
            Unternehmen berichtet sie möglicherweise in einer anderen Zeile
            (z.B. „Other income") oder hat keine wesentlichen Zinserträge. Prüfe
            den Jahresbericht (10-K/Geschäftsbericht) direkt. Der Zinsertrags-Ratio
            wird hier als 0% gewertet.
          </div>
        )}
      </div>

      {/* ── 5 Methodologien ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>ALLE 5 SCREENING-STANDARDS (wie Halal Terminal)</div>
        <div style={S.methodGrid}>
          {screening.map((m) => (
            <MethodCard key={m.id} method={m} />
          ))}
        </div>
      </div>

      {/* ── Vergleichstabelle ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>KENNZAHLEN-VERGLEICH</div>
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Kennzahl</th>
                {screening.map((m) => (
                  <th key={m.id} style={{ ...S.th, color: m.color }}>
                    {m.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Schuldenquote", idx: 0 },
                { label: "Cash/Forderungen", idx: 1 },
                { label: "Zinserträge / Umsatz", idx: -1 },
              ].map(({ label, idx }) => (
                <tr key={label} style={{ borderBottom: "1px solid #111" }}>
                  <td style={S.tdLabel}>{label}</td>
                  {screening.map((m) => {
                    const rr =
                      idx === -1 ? m.ratios[m.ratios.length - 1] : m.ratios[idx];
                    const color =
                      rr.pass === null
                        ? "#555"
                        : rr.pass
                        ? "#00FF88"
                        : "#FF3E3E";
                    return (
                      <td key={m.id} style={{ ...S.td, color }}>
                        <span style={{ fontWeight: 900 }}>
                          {rr.val === null ? "—" : fmt.pct(rr.val)}
                        </span>
                        <span style={{ color: "#333", fontWeight: 400 }}>
                          {" "}
                          / {rr.limit}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td style={S.tdLabel}>Ergebnis</td>
                {screening.map((m) => (
                  <td
                    key={m.id}
                    style={{
                      ...S.td,
                      fontWeight: 900,
                      color: m.pass ? "#00FF88" : "#FF3E3E",
                    }}
                  >
                    {m.pass ? "✓ PASS" : "✗ FAIL"}
                    {m.hasUnknown && (
                      <span style={{ color: "#555", fontSize: "0.6rem" }}>*</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Berechnungsformeln ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>BERECHNUNGEN (TRANSPARENT)</div>
        <div style={{ color: "#555", fontSize: "0.7rem", lineHeight: 2 }}>
          {metrics.totalDebt !== null && metrics.marketCap && (
            <div>
              Schulden / Market Cap:{" "}
              <span style={{ color: "#fff" }}>
                {fmt.money(metrics.totalDebt)} ÷ {fmt.money(metrics.marketCap)} ={" "}
                {fmt.pct((metrics.totalDebt / metrics.marketCap) * 100)}
              </span>
            </div>
          )}
          {metrics.totalCash !== null && metrics.marketCap && (
            <div>
              Cash / Market Cap:{" "}
              <span style={{ color: "#fff" }}>
                {fmt.money(metrics.totalCash)} ÷ {fmt.money(metrics.marketCap)} ={" "}
                {fmt.pct((metrics.totalCash / metrics.marketCap) * 100)}
              </span>
            </div>
          )}
          {metrics.totalDebt !== null && metrics.totalAssets && (
            <div>
              Schulden / Bilanzsumme:{" "}
              <span style={{ color: "#fff" }}>
                {fmt.money(metrics.totalDebt)} ÷ {fmt.money(metrics.totalAssets)} ={" "}
                {fmt.pct((metrics.totalDebt / metrics.totalAssets) * 100)}
              </span>
            </div>
          )}
          {metrics.interestIncome !== null && metrics.totalRevenue && (
            <div>
              Zinserträge / Umsatz (Reinigungssatz):{" "}
              <span style={{ color: "#FFD700" }}>
                {fmt.money(metrics.interestIncome)} ÷ {fmt.money(metrics.totalRevenue)} ={" "}
                {fmt.pct((metrics.interestIncome / metrics.totalRevenue) * 100)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Hinweise ── */}
      <div style={S.notes}>
        <div style={{ color: "#444", marginBottom: 4, fontWeight: 900 }}>
          HINWEISE:
        </div>
        <div>
          † DJIM/S&amp;P verwenden gleitenden 24/36-Monats-Ø — hier aktueller Kurs
          als Näherungswert (kann leicht abweichen)
        </div>
        <div>
          · Zinserträge = Summe der letzten 4 Quartale aus Yahoo Finance
          (Quartalsmeldungen)
        </div>
        <div>
          · Business Screen: Nur Sektoren/Branche — keine vollständige
          Umsatzanalyse
        </div>
        <div>
          · Quelldaten: Yahoo Finance. Immer mit Originalabschlüssen (10-K,
          Geschäftsbericht) verifizieren.
        </div>
        <div>
          · Keine Fatwa. Keine Anlageberatung. Nur zur Information.
        </div>
      </div>
    </div>
  );
}

function MethodCard({ method: m }) {
  const S = styles;
  return (
    <div
      style={{
        ...S.methodCard,
        borderTopColor: m.color,
        borderColor: m.pass ? m.color + "44" : "#1a1a1a",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ color: m.color, fontWeight: 900, fontSize: "0.9rem" }}>
          {m.id}
        </span>
        <span
          style={{
            fontSize: "1.1rem",
            fontWeight: 900,
            color: m.pass ? "#00FF88" : "#FF3E3E",
          }}
        >
          {m.pass ? "✓" : "✗"}
        </span>
      </div>
      <div style={{ color: "#444", fontSize: "0.55rem", marginBottom: 10 }}>
        {m.denom}
      </div>
      <div style={{ color: "#333", fontSize: "0.55rem", marginBottom: 12 }}>
        {m.note}
      </div>
      {m.ratios.map((rr, i) => (
        <div key={i} style={S.ratioRow}>
          <div
            style={{
              fontSize: "0.6rem",
              color: "#666",
              marginBottom: 2,
              lineHeight: 1.3,
            }}
          >
            {rr.label}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 900,
                color:
                  rr.pass === null ? "#555" : rr.pass ? "#00FF88" : "#FF3E3E",
              }}
            >
              {rr.val === null
                ? rr.warn
                  ? "⚠ n.a."
                  : "—"
                : fmt.pct(rr.val)}
            </span>
            <span style={{ color: "#333", fontSize: "0.6rem" }}>
              ≤{rr.limit}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════
const styles = {
  root: {
    background: "#000",
    minHeight: "100vh",
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    color: "#fff",
    padding: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1a1a1a",
    paddingBottom: 12,
    marginBottom: 24,
  },
  logo: { color: "#FFD700", fontWeight: 900, fontSize: "1rem" },
  logoSub: { color: "#333", fontSize: "0.7rem" },
  searchRow: {
    textAlign: "center",
    marginBottom: 28,
    display: "flex",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  input: {
    background: "#000",
    border: "2px solid #FFD700",
    color: "#fff",
    padding: "14px 20px",
    fontSize: "1.2rem",
    fontWeight: 900,
    width: "60%",
    maxWidth: 480,
    outline: "none",
    textAlign: "center",
    fontFamily: "inherit",
  },
  btn: {
    background: "#FFD700",
    border: "none",
    color: "#000",
    padding: "14px 22px",
    fontSize: "0.85rem",
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  statusMsg: {
    textAlign: "center",
    color: "#FFD700",
    padding: "30px",
    fontSize: "0.8rem",
    border: "1px solid #1a1a1a",
    maxWidth: 600,
    margin: "0 auto",
  },
  companyBanner: {
    border: "1px solid #1a1a1a",
    padding: "20px 24px",
    marginBottom: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tickerBig: {
    fontSize: "3.5rem",
    fontWeight: 900,
    letterSpacing: "-3px",
    lineHeight: 1,
  },
  overallBadge: {
    padding: "10px 20px",
    fontSize: "1.1rem",
    fontWeight: 900,
    display: "inline-block",
  },
  section: {
    border: "1px solid #1a1a1a",
    padding: "16px 18px",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFD700",
    fontSize: "0.62rem",
    letterSpacing: "3px",
    marginBottom: 14,
    textTransform: "uppercase",
  },
  rawGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 10,
  },
  rawCard: {
    background: "#080808",
    padding: "12px",
    borderTop: "3px solid #FFD700",
  },
  rawLabel: {
    color: "#555",
    fontSize: "0.58rem",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  rawVal: { fontSize: "1.05rem", fontWeight: 900, marginTop: 5 },
  rawNote: { color: "#333", fontSize: "0.55rem", marginTop: 3 },
  warningBox: {
    marginTop: 12,
    border: "1px solid #FFD70044",
    padding: "10px 14px",
    color: "#888",
    fontSize: "0.68rem",
    lineHeight: 1.7,
  },
  methodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10,
  },
  methodCard: {
    border: "1px solid #1a1a1a",
    borderTop: "4px solid #FFD700",
    padding: "14px 12px",
  },
  ratioRow: {
    borderTop: "1px solid #111",
    padding: "5px 0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.72rem",
  },
  th: {
    textAlign: "right",
    color: "#555",
    padding: "6px 8px",
    fontWeight: 400,
    borderBottom: "2px solid #1a1a1a",
    fontSize: "0.68rem",
  },
  tdLabel: {
    color: "#888",
    padding: "7px 4px",
    fontSize: "0.68rem",
  },
  td: {
    textAlign: "right",
    padding: "7px 8px",
    fontSize: "0.72rem",
  },
  notes: {
    border: "1px solid #111",
    padding: 14,
    color: "#333",
    fontSize: "0.6rem",
    lineHeight: 2,
    marginBottom: 12,
  },
};
