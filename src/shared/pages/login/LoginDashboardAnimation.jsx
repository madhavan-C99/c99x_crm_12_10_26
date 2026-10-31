import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Animated, vector (SVG) replica of the login dashboard preview.      */
/* No image files needed - stays sharp on every screen size.           */
/* ------------------------------------------------------------------ */

const css = `
.lda{position:relative;margin:-3% 0 -2%}
.lda::before{content:"";position:absolute;inset:10% 6%;background:radial-gradient(closest-side,rgba(144,217,22,.25),transparent);filter:blur(26px);animation:lda-glow 5s ease-in-out infinite}
.lda svg{position:relative;display:block;width:100%;height:auto;overflow:visible;font-family:'Inter',system-ui,sans-serif}
.lda-cd{animation:lda-pop .7s cubic-bezier(.2,.7,.2,1) var(--d,0s) both,lda-bob var(--bt,7s) ease-in-out calc(var(--d,0s) + .9s) infinite}
.lda-gy{transform-box:fill-box;transform-origin:50% 100%;animation:lda-gy .9s cubic-bezier(.2,.7,.2,1) var(--k,0s) both}
.lda-gx{transform-box:fill-box;transform-origin:0 50%;animation:lda-gx .9s cubic-bezier(.2,.7,.2,1) var(--k,0s) both}
.lda-gf{transform-box:fill-box;transform-origin:50% 50%;animation:lda-gx .8s cubic-bezier(.2,.7,.2,1) var(--k,0s) both}
.lda-ln{stroke-dasharray:1;animation:lda-draw 1.6s ease-out 1s both}
.lda-fl{animation:lda-fade .8s ease 2s both}
.lda-dn{animation:lda-dn 1s cubic-bezier(.2,.7,.2,1) var(--k,0s) both}
.lda-sh{animation:lda-sheen 5.5s ease-in-out 2.4s infinite}
@keyframes lda-pop{from{opacity:0;transform:translateY(22px) scale(.96)}to{opacity:1;transform:none}}
@keyframes lda-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes lda-glow{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes lda-gy{from{transform:scaleY(0)}}
@keyframes lda-gx{from{transform:scaleX(0)}}
@keyframes lda-draw{from{stroke-dashoffset:1}}
@keyframes lda-fade{from{opacity:0}}
@keyframes lda-dn{from{stroke-dasharray:0 100}}
@keyframes lda-sheen{0%,55%{transform:translateX(-90px)}100%{transform:translateX(480px)}}
@media (prefers-reduced-motion:reduce){.lda *,.lda::before{animation:none!important}}
`;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// count-up number
function useCount(target, delay = 700, duration = 1200) {
  const [val, setVal] = useState(reducedMotion() ? target : 0);
  useEffect(() => {
    if (reducedMotion()) {
      setVal(target);
      return undefined;
    }
    let raf;
    const t0 = performance.now() + delay;
    const tick = (t) => {
      const p = Math.min(Math.max((t - t0) / duration, 0), 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, duration]);
  return val;
}

/* ---------- tiny SVG helpers ---------- */
const Tx = ({ x, y, s, children, w = 400, f = "#374151", a = "start" }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={f} textAnchor={a}>
    {children}
  </text>
);

const Cap = ({ x, y }) => (
  <path
    d={`M${x} ${y + 2.4}l5-2.4 5 2.4-5 2.4zM${x + 2} ${y + 4.2}v2c1.7 1.2 4.3 1.2 6 0v-2`}
    fill="#84CC16"
    stroke="#84CC16"
    strokeWidth={0.5}
    strokeLinejoin="round"
  />
);

const Card = ({ x, y, w, h, d, bt, children }) => (
  <g className="lda-cd" style={{ "--d": `${d}s`, "--bt": `${bt}s` }}>
    <rect x={x} y={y} width={w} height={h} rx={3.5} fill="#fff" filter="url(#lda-sh)" />
    {children}
  </g>
);

/* ---------- data ---------- */
const KP = [
  ["Total Leads", 248, "", "#E1ECFA", "#EEF3FC", "#24539B"],
  ["Calls Made", 100, "", "#FFEFD0", "#FFE7C2", "#F59E0B"],
  ["Follow - Up", 95, "", "#BFF6F2", "#D8FBF8", "#2F7DDB"],
  ["Missed Follow Up", 22, "", "#FFDCE0", "#FFEBEC", "#E8404A"],
  ["Converted Leads", 120, "", "#D8EAFB", "#E9F3FD", "#2D9CDB"],
  ["Lost Leads", 128, "", "#FFDCE0", "#FFEBEC", "#E8404A"],
  ["Conversion Rate", 75, "%", "#CCF6E0", "#E3FBEE", "#16A34A"],
  ["Pending Payment", 100000, "", "#FFEBC9", "#FFE2B0", "#F59E0B"],
];

const PIPE_LABELS = ["New Lead", "Contacted", "Interested", "Follow Up", "Converted", "Lost"];
const PIPE_COLORS = ["#5AAAF5", "#FDBA5B", "#7B4DFF", "#F6EA3A", "#7ED321", "#F23B3B"];
const PIPE_W = [128, 108, 88, 70, 54, 40];

const BARS = [
  [0.5, 0.32, 0.1],
  [0.7, 0.5, 0.15],
  [1, 0.55, 0.32],
  [0.5, 0.36, 0.12],
  [0.52, 0.34, 0.14],
  [0.5, 0.3, 0.12],
];
const BAR_COLORS = ["#7B4DFF", "#7ED321", "#E5383B"];
const BAR_MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

const REV = [66, 80, 98, 92, 112, 106, 138, 128, 154];
const REV_MONTHS = ["Dec", "Jan", "Feb", "March", "April", "May", "Jun", "Jul", "Aug"];

const SOURCES = [
  [27.8, "#7ED321"],
  [25, "#5AB0F7"],
  [22.2, "#FDBA5B"],
  [14.5, "#7B4DFF"],
  [10.5, "#F04848"],
];
const SOURCE_LABELS = [
  ["Instagram", 122, 402, "M133 404l9 7"],
  ["Thara Ads", 203, 404, "M201 406l-10 6"],
  ["Walkin/", 112, 435, "M121 438l7 1"],
  ["referrals", 112, 439.5, ""],
  ["Swathi Leads", 205, 472, "M204 469l-10-6"],
  ["Website", 123, 486, "M135 483l9-7"],
];

const LOSS = [
  ["Budget", "Constraints", 123, "#F83B3B", 388],
  ["Bad Timing", "", 103, "#FFC15E", 408],
  ["Chose", "Competitor", 111, "#FFF04D", 431],
  ["Not", "Interested", 82, "#7B4DFF", 453],
  ["Online", "", 41, "#7BBEFF", 475],
  ["No", "Response", 20, "#7ED321", 497],
];

/* ---------- KPI card ---------- */
function Kpi({ k, i }) {
  const x = 205 + (i % 4) * 88.5;
  const y = i < 4 ? 172 : 211;
  const v = useCount(k[1]);
  return (
    <g>
      <rect x={x} y={y} width={84} height={31} rx={3.5} fill={`url(#lda-k${i})`} />
      <Tx x={x + 7} y={y + 10.5} s={4.8} w={500} f="#4B5563">
        {k[0]}
      </Tx>
      <Tx x={x + 7} y={y + 22} s={9.6} w={700} f={k[5]}>
        {v.toLocaleString("en-IN")}
        {k[2]}
      </Tx>
      <Tx x={x + 7} y={y + 27.8} s={3.3} f={k[5]}>
        {"\u2197 5% vs last period"}
      </Tx>
      <rect x={x + 68} y={y + 6} width={9} height={7.5} rx={1.5} fill="#000" opacity={0.12} />
    </g>
  );
}

export default function LoginDashboardAnimation({ maxWidth = 900 }) {
  // revenue line points
  const pts = REV.map((v, i) => [548 + i * 18, 136 - v * 0.38]);
  const line = "M" + pts.map((p) => `${p[0]} ${p[1]}`).join("L");
  const area = `${line}L${pts[8][0]} 136L${pts[0][0]} 136Z`;

  // donut segments
  let offset = 0;
  const donut = SOURCES.map((sg, i) => {
    const el = (
      <circle
        key={sg[1]}
        cx={162}
        cy={433}
        r={31}
        fill="none"
        stroke={sg[1]}
        strokeWidth={26}
        pathLength={100}
        strokeDasharray={`${sg[0] - 0.7} 100`}
        strokeDashoffset={-offset}
        className="lda-dn"
        style={{ "--k": `${1 + i * 0.15}s` }}
      />
    );
    offset += sg[0];
    return el;
  });

  return (
    <div
      className="lda"
      aria-hidden="true"
      style={{
        width: `min(${maxWidth}px, 98%, calc((100vh - 250px) * 1.35))`,
      }}
    >
      <style>{css}</style>
      <svg viewBox="0 0 829 613" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="lda-sh" x="-15%" y="-15%" width="130%" height="135%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity=".5" />
          </filter>
          <clipPath id="lda-cw">
            <rect x="170" y="90" width="392" height="293" rx="3.5" />
          </clipPath>
          <linearGradient id="lda-fl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#84CC16" stopOpacity=".35" />
            <stop offset="1" stopColor="#84CC16" stopOpacity=".02" />
          </linearGradient>
          <linearGradient id="lda-shg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          {KP.map((k, i) => (
            <linearGradient key={k[0]} id={`lda-k${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={k[3]} />
              <stop offset="1" stopColor={k[4]} />
            </linearGradient>
          ))}
        </defs>

        {/* ============ MAIN DASHBOARD WINDOW ============ */}
        <g className="lda-cd" style={{ "--d": "0s", "--bt": "9s" }}>
          <rect x="170" y="90" width="392" height="293" rx="3.5" fill="#F2F2F2" filter="url(#lda-sh)" />
          <g clipPath="url(#lda-cw)">
            <rect x="170" y="90" width="392" height="26" fill="#fff" />
            <rect x="170" y="116" width="392" height="267" fill="#F2F2F2" />

            {/* sidebar */}
            <rect x="170" y="90" width="25" height="193" fill="#0B0B0B" />
            <circle cx="183" cy="104" r="5.2" fill="#1d2b0a" stroke="#84CC16" strokeWidth="1" />
            <rect x="172" y="123" width="21" height="10" rx="2" fill="#E7F7C4" />
            {[128, 142, 156, 170, 184, 198].map((y, i) => (
              <rect
                key={y}
                x="180.5"
                y={y - 2.5}
                width="5"
                height="5"
                rx="1"
                fill={i ? "#fff" : "#0B0B0B"}
                opacity={i ? 0.9 : 1}
              />
            ))}
            <circle cx="183" cy="249" r="2.4" fill="#fff" />
            <circle cx="183" cy="263" r="2.4" fill="#fff" />

            {/* top bar */}
            <rect x="481" y="100.5" width="5.5" height="6" rx="1.2" fill="#111" />
            <path d="M495 106.5h5l-.8-1.4v-2a1.7 1.7 0 00-3.4 0v2z" fill="#111" />
            <circle cx="515" cy="103.5" r="5" fill="#84CC16" />
            <Tx x={515} y={105.1} s={4.4} w={700} f="#fff" a="middle">
              P
            </Tx>

            <Tx x={203} y={128.5} s={8} w={700} f="#111">
              Dashboard
            </Tx>
            <Tx x={203} y={136} s={4.2} f="#8A8A8A">
              Track and manage all pending payment collections from leads
            </Tx>

            {/* filter bar */}
            <rect x="203" y="147.5" width="352" height="13" rx="2" fill="#fff" />
            {[
              [447, 26, "Today \u25BE"],
              [478, 44, "\u25A6 Total Report"],
              [526, 28, "\u25A6 Export"],
            ].map((b) => (
              <g key={b[2]}>
                <rect x={b[0]} y="149.5" width={b[1]} height="9" rx="1.5" fill="#F7F7F7" stroke="#DDD" strokeWidth=".4" />
                <Tx x={b[0] + b[1] / 2} y={155.6} s={3.6} f="#555" a="middle">
                  {b[2]}
                </Tx>
              </g>
            ))}

            {/* KPI cards */}
            {KP.map((k, i) => (
              <Kpi key={k[0]} k={k} i={i} />
            ))}

            {/* pipeline */}
            <rect x="203" y="256" width="190" height="114" rx="3.5" fill="#fff" />
            <Cap x={211} y={261} />
            <Tx x={222} y={266.5} s={4.8} w={600} f="#111">
              Pipeline
            </Tx>
            <Tx x={380} y={266.5} s={4.4} f="#555" a="end">
              Total Lost:
            </Tx>
            <Tx x={383} y={266.5} s={4.6} w={700} f="#E11D48">
              27
            </Tx>
            {PIPE_LABELS.map((n, i) => {
              const y = 282 + i * 12;
              return (
                <g key={n}>
                  <rect x="209" y={y} width="40" height="8" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth=".4" />
                  <circle cx="214" cy={y + 4} r="1.5" fill={PIPE_COLORS[i]} />
                  <Tx x={218} y={y + 5.3} s={3} f="#555">
                    {n}
                  </Tx>
                </g>
              );
            })}
            {PIPE_COLORS.map((col, i) => {
              const y = 280 + i * 14.4;
              const tw = PIPE_W[i];
              const bw = PIPE_W[i + 1] || 28;
              const cx = 316;
              return (
                <polygon
                  key={col}
                  points={`${cx - tw / 2},${y} ${cx + tw / 2},${y} ${cx + bw / 2},${y + 12.6} ${cx - bw / 2},${y + 12.6}`}
                  fill={col}
                  className="lda-gf"
                  style={{ "--k": `${1 + i * 0.1}s` }}
                />
              );
            })}

            {/* lead status by month */}
            <rect x="397" y="257" width="163" height="113" rx="3.5" fill="#fff" />
            <Cap x={405} y={261} />
            <Tx x={416} y={266.5} s={4.6} w={600} f="#111">
              Lead Status By Month
            </Tx>
            {[0, 50, 100, 150, 200].map((v) => {
              const y = 346 - v * 0.31;
              return (
                <g key={v}>
                  <line x1="418" x2="548" y1={y} y2={y} stroke="#ECECEC" strokeWidth=".4" />
                  <Tx x={415} y={y + 1} s={3} f="#888" a="end">
                    {v}
                  </Tx>
                </g>
              );
            })}
            {BARS.map((g, i) => {
              const cx = 428 + i * 21;
              return (
                <g key={BAR_MONTHS[i]}>
                  {g.map((v, j) => (
                    <rect
                      key={j}
                      x={cx - 6.5 + j * 4.6}
                      y={346 - v * 62}
                      width="4"
                      height={v * 62}
                      fill={BAR_COLORS[j]}
                      className="lda-gy"
                      style={{ "--k": `${1 + i * 0.08 + j * 0.04}s` }}
                    />
                  ))}
                  <Tx x={cx} y={351} s={3} f="#777" a="middle">
                    {BAR_MONTHS[i]}
                  </Tx>
                </g>
              );
            })}
            <rect x="470" y="360" width="4" height="4" fill="#7B4DFF" />
            <Tx x={476} y={363.5} s={3} f="#777">
              Not Interested
            </Tx>

            {/* sheen */}
            <rect x="170" y="90" width="70" height="293" fill="url(#lda-shg)" className="lda-sh" opacity=".5" />
          </g>
        </g>

        {/* ============ REVENUE BY MONTH ============ */}
        <Card x={524} y={32} w={178} h={118} d={0.35} bt={6.5}>
          <Cap x={531} y={37} />
          <Tx x={543} y={43} s={4.8} w={600} f="#111">
            Revenue by Month
          </Tx>
          {[0, 50, 100, 150, 200].map((v) => {
            const y = 136 - v * 0.38;
            return (
              <g key={v}>
                <line x1="546" x2="694" y1={y} y2={y} stroke="#E9E9E9" strokeWidth=".4" />
                <Tx x={542} y={y + 1} s={3} f="#888" a="end">
                  {v}
                </Tx>
              </g>
            );
          })}
          {pts.map((p, i) => (
            <g key={REV_MONTHS[i]}>
              <line x1={p[0]} x2={p[0]} y1="60" y2="136" stroke="#EFEFEF" strokeWidth=".4" />
              <Tx x={p[0]} y={143} s={3} f="#777" a="middle">
                {REV_MONTHS[i]}
              </Tx>
            </g>
          ))}
          <path d={area} fill="url(#lda-fl)" className="lda-fl" />
          <path
            d={line}
            fill="none"
            stroke="#84CC16"
            strokeWidth="1.1"
            strokeLinejoin="round"
            pathLength={1}
            className="lda-ln"
          />
        </Card>

        {/* ============ LEAD SOURCE ============ */}
        <Card x={87} y={349} w={151} h={169} d={0.5} bt={7.5}>
          <Cap x={95} y={354} />
          <Tx x={107} y={359.8} s={4.8} w={600} f="#111">
            Lead Source
          </Tx>
          <Tx x={218} y={359.8} s={4.4} f="#555" a="end">
            Total
          </Tx>
          <Tx x={220} y={359.8} s={4.6} w={700} f="#111">
            180
          </Tx>
          <g transform="rotate(-90 162 433)">{donut}</g>
          {SOURCE_LABELS.map((l) => (
            <g key={l[0]}>
              <Tx x={l[1]} y={l[2]} s={3.2} w={600} f="#333">
                {l[0]}
              </Tx>
              {l[3] && <path d={l[3]} stroke="#999" strokeWidth=".35" fill="none" />}
            </g>
          ))}
        </Card>

        {/* ============ LOSS ANALYSIS ============ */}
        <Card x={470} y={349} w={183} h={203} d={0.65} bt={6}>
          <Cap x={478} y={354} />
          <Tx x={490} y={359.8} s={5.4} w={600} f="#111">
            Loss Analysis
          </Tx>
          <Tx x={640} y={359.8} s={4.6} f="#555" a="end">
            Total Lost:
          </Tx>
          <Tx x={643} y={359.8} s={4.8} w={700} f="#E11D48">
            27
          </Tx>
          {LOSS.map((q, i) => (
            <g key={q[0]}>
              <rect
                x="518"
                y={q[4] - 6.5}
                width={q[2]}
                height="13"
                rx="2"
                fill={q[3]}
                className="lda-gx"
                style={{ "--k": `${1 + i * 0.1}s` }}
              />
              {q[1] ? (
                <>
                  <Tx x={511} y={q[4] - 0.8} s={3.7} f="#555" a="end">
                    {q[0]}
                  </Tx>
                  <Tx x={511} y={q[4] + 3.6} s={3.7} f="#555" a="end">
                    {q[1]}
                  </Tx>
                </>
              ) : (
                <Tx x={511} y={q[4] + 1.2} s={3.7} f="#555" a="end">
                  {q[0]}
                </Tx>
              )}
            </g>
          ))}
          <rect x="477" y="509" width="169" height="34" rx="3" fill="#FDEEEE" stroke="#F6D0D0" strokeWidth=".4" />
          <text x="481" y="518" fontSize="3.6" fill="#444">
            <tspan fontWeight="700">Key Insight:</tspan>
            <tspan>{" 44% of leads are lost due to "}</tspan>
            <tspan fill="#E11D48">budget</tspan>
          </text>
          <text x="481" y="525.5" fontSize="3.6" fill="#444">
            <tspan fill="#E11D48">constraints.</tspan>
            <tspan>{" Consider addressing this in your sales"}</tspan>
          </text>
          <text x="481" y="533" fontSize="3.6" fill="#444">
            approach.
          </text>
        </Card>
      </svg>
    </div>
  );
}
