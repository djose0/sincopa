'use client'
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, X, Pencil, Check, Trash2, RefreshCw, Archive,
  CreditCard, Zap, TrendingDown, Home, BarChart2,
  List, Settings, ChevronRight, ChevronDown, Info,
  ArrowLeft, Calendar, DollarSign, Layers
} from "lucide-react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  // backgrounds
  bg:      "#FAF8F4",
  surface: "#FFFFFF",
  card:    "#F4F1EB",

  // brand black
  ink:     "#1A1A1A",
  muted:   "#8A8A8A",
  border:  "#E8E4DC",

  // Category colors
  needs:   "#2E4DA0",   // azul — necesidades
  wants:   "#E8652A",   // naranja — deseos
  commit:  "#7C3AED",   // violeta — compromisos (subs/diferidos/préstamos)
  savings: "#2D6A4F",   // verde — ahorros

  // Accent
  yellow:  "#F2B830",
  red:     "#D63C2F",
  green:   "#2D6A4F",
  cream:   "#F0EBE0",
};

const FONT_DISPLAY = "'Georgia', 'Times New Roman', serif";
const FONT_BODY    = "'system-ui', '-apple-system', 'Helvetica Neue', sans-serif";
const FONT_MONO    = "'SF Mono', 'Fira Code', 'Courier New', monospace";

const RULES = {
  "50/30/20": { needs:50, wants:30, savings:20 },
  "50/25/25": { needs:50, wants:25, savings:25 },
  "Personalizado": null,
};

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const NEEDS_KW  = ["renta","rent","alquiler","luz","agua","gas","internet","seguro","salud","médico","supermercado","mercado","gasolina","hipoteca","electricidad","farmacia","celular","plan"];
const WANTS_KW  = ["pizza","restaurante","café","bar","netflix","spotify","ropa","viaje","hotel","concierto","cine","juego","amazon","uber","rappi","mall","shopping","vacaciones","gym","entretenimiento","copa","cerveza"];
const autoCat = n => {
  const l = n.toLowerCase();
  return NEEDS_KW.some(k=>l.includes(k)) ? "needs" : "wants";
};

const QUICK_NEEDS = [
  { icon:"🏠", label:"Renta / Hipoteca" },
  { icon:"💡", label:"Luz" },
  { icon:"💧", label:"Agua" },
  { icon:"🔥", label:"Gas" },
  { icon:"📡", label:"Internet" },
  { icon:"📱", label:"Plan Celular" },
  { icon:"🛒", label:"Supermercado" },
  { icon:"🏥", label:"Seguro Salud" },
];

// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmt  = n => `$${(+n||0).toLocaleString("es-MX", { minimumFractionDigits:0, maximumFractionDigits:0 })}`;
const fmtD = n => `$${(+n||0).toLocaleString("es-MX", { minimumFractionDigits:2, maximumFractionDigits:2 })}`;
const pct  = (a,b) => b > 0 ? Math.min(100, Math.round(a/b*100)) : 0;

// ─── LOCAL STORAGE PERSISTENCE ───────────────────────────────────────────────
const STORE_KEY = "sincopa-v5";
function loadData() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}
function saveData(d) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch {}
}

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────

function Pill({ color, children, small }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center",
      background: color + "18",
      color: color,
      border: `1px solid ${color}30`,
      borderRadius: 999,
      padding: small ? "2px 8px" : "3px 10px",
      fontSize: small ? 10 : 11,
      fontWeight: 600,
      letterSpacing: 0.3,
      fontFamily: FONT_BODY,
    }}>{children}</span>
  );
}

function Card({ children, style={}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.surface,
      borderRadius: 20,
      padding: "18px 20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}>{children}</div>
  );
}

function StatBadge({ label, value, color, sub }) {
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:22, fontWeight:800, color: color||C.ink, fontFamily:FONT_DISPLAY, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:C.muted, marginTop:1, fontFamily:FONT_BODY }}>{sub}</div>}
      <div style={{ fontSize:10, color:C.muted, marginTop:2, letterSpacing:0.5, textTransform:"uppercase", fontFamily:FONT_BODY }}>{label}</div>
    </div>
  );
}

// ─── PIE CHART (fixed, working) ───────────────────────────────────────────────
function DonutChart({ segments, size=160 }) {
  const r = 54, cx = size/2, cy = size/2;
  const stroke = 22;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s,sg)=>s+(+sg.value||0), 0) || 1;

  let offset = 0;
  const arcs = segments.map(sg => {
    const v = +sg.value || 0;
    const dash = (v / total) * circ;
    const gap  = circ - dash;
    const arc  = { ...sg, dash, gap, offset: -offset * circ / total };
    offset += v;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:"rotate(-90deg)" }}>
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={stroke}/>
      {arcs.map((arc,i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={stroke}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color, height=8 }) {
  const p = pct(value, max);
  const over = value > max && max > 0;
  return (
    <div style={{ background: C.border, borderRadius:999, height, overflow:"hidden" }}>
      <div style={{
        height:"100%", borderRadius:999,
        width:`${Math.min(p,100)}%`,
        background: over ? C.red : color,
        transition:"width 0.5s cubic-bezier(.4,0,.2,1)",
      }}/>
    </div>
  );
}

// ─── INPUT FIELD ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, onKeyDown, type="text", placeholder, prefix, suffix, style={} }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, ...style }}>
      {label && <label style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:0.8, fontFamily:FONT_BODY }}>{label}</label>}
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        {prefix && <span style={{ position:"absolute", left:12, fontSize:14, color:C.muted, fontFamily:FONT_MONO, pointerEvents:"none" }}>{prefix}</span>}
        <input
          type={type} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
          style={{
            width:"100%", border:`1.5px solid ${C.border}`,
            borderRadius:12, background:C.bg,
            fontFamily:type==="number"?FONT_MONO:FONT_BODY,
            fontSize:14, color:C.ink,
            padding: prefix ? "10px 12px 10px 28px" : "10px 12px",
            outline:"none", boxSizing:"border-box",
            transition:"border-color 0.2s",
          }}
          onFocus={e=>e.target.style.borderColor=C.ink}
          onBlur={e=>e.target.style.borderColor=C.border}
        />
        {suffix && <span style={{ position:"absolute", right:12, fontSize:12, color:C.muted, fontFamily:FONT_BODY }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options, style={} }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, ...style }}>
      {label && <label style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:0.8, fontFamily:FONT_BODY }}>{label}</label>}
      <select value={value} onChange={onChange} style={{
        border:`1.5px solid ${C.border}`, borderRadius:12, background:C.bg,
        fontFamily:FONT_BODY, fontSize:14, color:C.ink,
        padding:"10px 12px", outline:"none", cursor:"pointer", appearance:"none",
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, color, outline, small, full, disabled, style={} }) {
  const bg = outline ? "transparent" : (color || C.ink);
  const fg = outline ? (color || C.ink) : C.surface;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border: `2px solid ${color||C.ink}`,
      borderRadius: small ? 10 : 14,
      background: bg, color: fg,
      fontFamily: FONT_BODY,
      fontWeight: 700,
      fontSize: small ? 12 : 14,
      padding: small ? "7px 14px" : "12px 20px",
      cursor: disabled ? "default" : "pointer",
      width: full ? "100%" : "auto",
      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
      opacity: disabled ? 0.4 : 1,
      transition:"all 0.15s",
      ...style,
    }}>{children}</button>
  );
}

// ─── AMORTIZATION TABLE ───────────────────────────────────────────────────────
function AmortizationTable({ item, onClose }) {
  const monthly = item.monthly || (item.total / item.quotas);
  const rows = [];
  for(let i=1; i<=item.quotas; i++) {
    rows.push({
      n: i,
      paid: i <= item.paid,
      amount: monthly,
    });
  }
  const totalLeft = monthly * (item.quotas - item.paid);

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.surface, borderRadius:"24px 24px 0 0",
        width:"100%", maxWidth:480,
        maxHeight:"85vh", overflowY:"auto",
        padding:"0 0 32px 0",
      }}>
        {/* Handle */}
        <div style={{ display:"flex",justifyContent:"center",padding:"12px 0 8px" }}>
          <div style={{ width:36,height:4,borderRadius:2,background:C.border }}/>
        </div>
        <div style={{ padding:"8px 24px 16px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
            <div style={{ fontFamily:FONT_DISPLAY,fontSize:20,fontWeight:700,color:C.ink }}>{item.name}</div>
            <button onClick={onClose} style={{ border:"none",background:"none",cursor:"pointer",padding:4 }}><X size={18} color={C.muted}/></button>
          </div>
          <div style={{ display:"flex",gap:16,marginBottom:20 }}>
            <StatBadge label="Pago mensual" value={fmt(monthly)} color={C.commit}/>
            <StatBadge label="Cuotas" value={`${item.paid}/${item.quotas}`} color={C.ink}/>
            <StatBadge label="Por pagar" value={fmt(totalLeft)} color={C.red}/>
          </div>
          <ProgressBar value={item.paid} max={item.quotas} color={C.commit}/>
          <div style={{ fontSize:11,color:C.muted,marginTop:6,marginBottom:20,fontFamily:FONT_BODY }}>
            {item.paid} de {item.quotas} cuotas completadas
          </div>

          {/* Table */}
          <div style={{ fontFamily:FONT_BODY }}>
            <div style={{ display:"grid",gridTemplateColumns:"40px 1fr 80px 60px",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.5 }}>
              <span>#</span><span>Estado</span><span style={{textAlign:"right"}}>Monto</span><span style={{textAlign:"center"}}>✓</span>
            </div>
            {rows.map(row => (
              <div key={row.n} style={{
                display:"grid",gridTemplateColumns:"40px 1fr 80px 60px",gap:8,
                padding:"10px 0", borderBottom:`1px solid ${C.border}`,
                background: row.paid ? C.bg : "transparent",
                opacity: row.paid ? 0.65 : 1,
              }}>
                <span style={{ fontSize:13,fontFamily:FONT_MONO,color:C.muted }}>{row.n}</span>
                <span>
                  <Pill color={row.paid ? C.green : C.commit} small>{row.paid ? "Pagada" : "Pendiente"}</Pill>
                </span>
                <span style={{ textAlign:"right",fontSize:13,fontFamily:FONT_MONO,fontWeight:600 }}>{fmt(row.amount)}</span>
                <span style={{ textAlign:"center",fontSize:16 }}>{row.paid ? "✅" : "○"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MONTH ROLLOVER MODAL ─────────────────────────────────────────────────────
function RolloverModal({ currentMonthLabel, nextLabel, savingsToCarry, onConfirm, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <Card style={{ maxWidth:360,width:"100%",padding:28 }}>
        <div style={{ fontFamily:FONT_DISPLAY,fontSize:22,fontWeight:700,marginBottom:8 }}>Cerrar {currentMonthLabel}</div>
        <div style={{ fontSize:13,color:C.muted,marginBottom:20,fontFamily:FONT_BODY,lineHeight:1.6 }}>
          Vas a archivar este mes y comenzar {nextLabel}.
        </div>
        <div style={{ background:`${C.savings}12`,borderRadius:16,padding:"16px 20px",marginBottom:20,border:`1px solid ${C.savings}30` }}>
          <div style={{ fontSize:10,color:C.savings,fontWeight:700,letterSpacing:1,textTransform:"uppercase",fontFamily:FONT_BODY,marginBottom:4 }}>Ahorros que se transfieren</div>
          <div style={{ fontFamily:FONT_DISPLAY,fontSize:32,fontWeight:800,color:C.savings }}>{fmt(savingsToCarry)}</div>
        </div>
        <div style={{ fontSize:12,color:C.muted,lineHeight:1.8,marginBottom:24,fontFamily:FONT_BODY }}>
          ✅ Se conservan: recurrentes, compromisos, configuración<br/>
          🗑️ Se borran: gastos puntuales del mes<br/>
          📅 Los diferidos avanzan una cuota
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <Btn outline onClick={onClose} full>Cancelar</Btn>
          <Btn onClick={onConfirm} full color={C.savings}>Cerrar mes ▶</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── HISTORY PANEL ────────────────────────────────────────────────────────────
function HistorySheet({ history, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.surface,borderRadius:"24px 24px 0 0",
        width:"100%",maxWidth:480,margin:"0 auto",
        maxHeight:"80vh",overflowY:"auto",
      }}>
        <div style={{ display:"flex",justifyContent:"center",padding:"12px 0 4px" }}>
          <div style={{ width:36,height:4,borderRadius:2,background:C.border }}/>
        </div>
        <div style={{ padding:"8px 24px 32px" }}>
          <div style={{ fontFamily:FONT_DISPLAY,fontSize:22,fontWeight:700,marginBottom:20 }}>Historial</div>
          {history.length === 0 && (
            <div style={{ textAlign:"center",color:C.muted,fontSize:13,padding:"40px 0",fontFamily:FONT_BODY }}>Aún no hay meses cerrados</div>
          )}
          {[...history].reverse().map((m,i) => {
            const totalInc = (+m.salary||0) + (m.extras||[]).reduce((s,e)=>s+(+e.amount||0),0);
            const ar = m.rule==="Personalizado" ? m.custom : RULES[m.rule];
            const saved = totalInc*(ar?.savings||20)/100;
            const totalSpent = totalInc - saved;
            return (
              <Card key={i} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                  <div style={{ fontFamily:FONT_DISPLAY,fontSize:17,fontWeight:700 }}>{MONTHS_ES[m.month-1]} {m.year}</div>
                  <Pill color={C.savings}>{fmt(saved)} ahorrado</Pill>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                  <div style={{ background:C.bg,borderRadius:12,padding:"10px 14px" }}>
                    <div style={{ fontSize:10,color:C.muted,fontFamily:FONT_BODY }}>Ingreso</div>
                    <div style={{ fontFamily:FONT_MONO,fontSize:16,fontWeight:700,color:C.needs }}>{fmt(totalInc)}</div>
                  </div>
                  <div style={{ background:C.bg,borderRadius:12,padding:"10px 14px" }}>
                    <div style={{ fontSize:10,color:C.muted,fontFamily:FONT_BODY }}>Gastos</div>
                    <div style={{ fontFamily:FONT_MONO,fontSize:16,fontWeight:700,color:C.wants }}>{fmt(totalSpent)}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── EMERGENCY MODAL ─────────────────────────────────────────────────────────
function EmergencyModal({ available, onWithdraw, onClose }) {
  const msgs = ["¿Tu 'emergencia' es otra suscripción olvidada?","Cada peso retirado es tu yo futuro llorando.","¿Es esto realmente una emergencia?","Fascinante. Otro retiro 'de emergencia'."];
  const [msg] = useState(msgs[Math.floor(Math.random()*msgs.length)]);
  const [confirmed, setConfirmed] = useState(false);
  const [just, setJust] = useState("");
  const [amt, setAmt] = useState("");
  const ok = confirmed && just.length > 10 && parseFloat(amt) > 0;

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <Card style={{ maxWidth:360,width:"100%",padding:28 }}>
        <div style={{ fontFamily:FONT_DISPLAY,fontSize:22,fontWeight:700,color:C.red,marginBottom:12 }}>⚠ Retiro de emergencia</div>
        <div style={{ background:`${C.red}12`,border:`1px solid ${C.red}30`,borderRadius:12,padding:"12px 14px",fontFamily:FONT_BODY,fontSize:13,color:C.ink,fontStyle:"italic",marginBottom:16 }}>
          "{msg}"
        </div>
        <div style={{ fontSize:12,color:C.muted,marginBottom:16,fontFamily:FONT_BODY }}>Disponible: <strong style={{ color:C.ink }}>{fmt(available)}</strong></div>
        <Field label="Monto" type="number" prefix="$" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="0" style={{ marginBottom:12 }}/>
        <Field label="Justificación honesta" value={just} onChange={e=>setJust(e.target.value)} placeholder="¿Por qué es una emergencia real?" style={{ marginBottom:16 }}/>
        <label style={{ display:"flex",alignItems:"flex-start",gap:10,fontSize:12,fontFamily:FONT_BODY,color:C.muted,cursor:"pointer",marginBottom:20 }}>
          <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} style={{ width:16,height:16,marginTop:1,flexShrink:0 }}/>
          Acepto que probablemente no es una emergencia real
        </label>
        <div style={{ display:"flex",gap:10 }}>
          <Btn outline onClick={onClose} full>Cancelar</Btn>
          <Btn onClick={()=>{ if(ok){ onWithdraw(parseFloat(amt)); onClose(); }}} full color={C.red} disabled={!ok}>Retirar</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── COMMITMENT FORM (deferred / subscription / loan) ────────────────────────
function CommitmentForm({ onAdd, onClose, editing }) {
  const [form, setForm] = useState(editing || { name:"", type:"deferred", monthly:"", quotas:"", paid:"0", notes:"" });
  const s = (k,v) => setForm(p=>({...p,[k]:v}));
  const isDeferred = form.type === "deferred" || form.type === "loan";

  const handleSubmit = () => {
    if(!form.name || !form.monthly) return;
    onAdd({
      id: editing?.id || Date.now(),
      name: form.name,
      type: form.type,
      monthly: parseFloat(form.monthly),
      quotas: isDeferred ? parseInt(form.quotas)||0 : null,
      paid: isDeferred ? parseInt(form.paid)||0 : null,
      total: isDeferred ? parseFloat(form.monthly) * parseInt(form.quotas||0) : null,
      notes: form.notes,
      active: true,
    });
    onClose();
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.surface,borderRadius:"24px 24px 0 0",
        width:"100%",maxWidth:480,margin:"0 auto",padding:"0 0 40px 0",
      }}>
        <div style={{ display:"flex",justifyContent:"center",padding:"12px 0 4px" }}>
          <div style={{ width:36,height:4,borderRadius:2,background:C.border }}/>
        </div>
        <div style={{ padding:"8px 24px 0" }}>
          <div style={{ fontFamily:FONT_DISPLAY,fontSize:20,fontWeight:700,marginBottom:20 }}>
            {editing ? "Editar compromiso" : "Nuevo compromiso"}
          </div>
          <div style={{ display:"grid",gap:14 }}>
            <Select label="Tipo"
              value={form.type}
              onChange={e=>s("type",e.target.value)}
              options={[
                { value:"deferred", label:"💳 Diferido (cuotas con fin)" },
                { value:"subscription", label:"🔄 Suscripción (recurrente)" },
                { value:"loan", label:"🏦 Préstamo / Financiamiento" },
              ]}
            />
            <Field label="Nombre" value={form.name} onChange={e=>s("name",e.target.value)} placeholder="Netflix, Laptop a meses, Crédito..."/>
            <Field label="Pago mensual" type="number" prefix="$" value={form.monthly} onChange={e=>s("monthly",e.target.value)} placeholder="0"/>
            {isDeferred && (
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <Field label="Cuotas totales" type="number" value={form.quotas} onChange={e=>s("quotas",e.target.value)} placeholder="12"/>
                <Field label="Cuotas pagadas" type="number" value={form.paid} onChange={e=>s("paid",e.target.value)} placeholder="0"/>
              </div>
            )}
            <Field label="Notas (opcional)" value={form.notes} onChange={e=>s("notes",e.target.value)} placeholder="Tarjeta BBVA, vence en..."/>
            <Btn onClick={handleSubmit} full color={C.commit}>
              {editing ? "Guardar cambios" : "Agregar compromiso"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SCREENS ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ── HOME SCREEN ──────────────────────────────────────────────────────────────
function HomeScreen({ data, derived, actions }) {
  const { inc, needsSpent, wantsSpent, savingsSpent, needsBudget, wantsBudget, savingsBudget,
          totalBalance, monthSavings, totalSavings, commitmentTotal, overNeeds, overWants, isNeg,
          activeRule, commitmentPct } = derived;
  const { currentMonth, currentYear } = data;
  const [showRollover, setShowRollover] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const segments = [
    { value: needsSpent,  color: C.needs },
    { value: wantsSpent,  color: C.wants },
    { value: commitmentTotal, color: C.commit },
    { value: Math.max(0, savingsBudget - savingsSpent), color: C.savings },
  ].filter(s => s.value > 0);

  return (
    <div style={{ padding:"0 16px 100px" }}>
      {showRollover && (
        <RolloverModal
          currentMonthLabel={`${MONTHS_ES[currentMonth-1]} ${currentYear}`}
          nextLabel={(() => { const nm=currentMonth===12?1:currentMonth+1; const ny=currentMonth===12?currentYear+1:currentYear; return `${MONTHS_ES[nm-1]} ${ny}`; })()}
          savingsToCarry={monthSavings}
          onConfirm={()=>{ actions.doRollover(); setShowRollover(false); }}
          onClose={()=>setShowRollover(false)}
        />
      )}
      {showHistory && <HistorySheet history={data.history} onClose={()=>setShowHistory(false)}/>}
      {showEmergency && (
        <EmergencyModal
          available={totalSavings}
          onWithdraw={actions.withdraw}
          onClose={()=>setShowEmergency(false)}
        />
      )}

      {/* Month + greeting */}
      <div style={{ padding:"20px 0 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:13, color:C.muted, fontFamily:FONT_BODY }}>{MONTHS_ES[currentMonth-1]} {currentYear}</div>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:26, fontWeight:800, color:C.ink, lineHeight:1.1 }}>Tu presupuesto</div>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={()=>setShowHistory(true)} style={{ border:`1.5px solid ${C.border}`,borderRadius:12,background:C.surface,padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontFamily:FONT_BODY,color:C.muted }}>
            <Archive size={14}/> Historial
          </button>
          <button onClick={()=>setShowRollover(true)} style={{ border:`1.5px solid ${C.commit}`,borderRadius:12,background:`${C.commit}12`,padding:"8px 12px",cursor:"pointer",fontSize:12,fontFamily:FONT_BODY,color:C.commit,fontWeight:600 }}>
            Cerrar mes
          </button>
        </div>
      </div>

      {/* Balance hero card */}
      <Card style={{ background: isNeg ? C.red : C.ink, marginBottom:16, padding:"24px 24px 20px" }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", letterSpacing:1, textTransform:"uppercase", fontFamily:FONT_BODY, marginBottom:6 }}>Balance libre</div>
        <div style={{ fontFamily:FONT_DISPLAY, fontSize:44, fontWeight:800, color:C.surface, lineHeight:1, marginBottom:4 }}>
          {fmt(totalBalance)}
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", fontFamily:FONT_BODY }}>
          de {fmt(inc)} totales este mes
        </div>
        <div style={{ display:"flex", gap:16, marginTop:20, paddingTop:20, borderTop:"1px solid rgba(255,255,255,0.12)" }}>
          <StatBadge label="Necesidades" value={fmt(needsBudget)} color="rgba(255,255,255,0.9)" sub={`${activeRule.needs}%`}/>
          <div style={{ width:1, background:"rgba(255,255,255,0.12)" }}/>
          <StatBadge label="Deseos" value={fmt(wantsBudget)} color="rgba(255,255,255,0.9)" sub={`${activeRule.wants}%`}/>
          <div style={{ width:1, background:"rgba(255,255,255,0.12)" }}/>
          <StatBadge label="Ahorros" value={fmt(savingsBudget)} color="rgba(255,255,255,0.9)" sub={`${activeRule.savings}%`}/>
        </div>
      </Card>

      {/* Donut + legend */}
      {inc > 0 && (
        <Card style={{ marginBottom:16, padding:"20px" }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.ink,fontFamily:FONT_BODY,marginBottom:16 }}>Distribución del mes</div>
          <div style={{ display:"flex",alignItems:"center",gap:20 }}>
            <div style={{ position:"relative",flexShrink:0 }}>
              <DonutChart segments={segments} size={140}/>
              <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                <div style={{ fontFamily:FONT_MONO,fontSize:18,fontWeight:800,color:C.ink }}>{pct(needsSpent+wantsSpent+commitmentTotal,inc)}%</div>
                <div style={{ fontSize:9,color:C.muted,fontFamily:FONT_BODY }}>gastado</div>
              </div>
            </div>
            <div style={{ flex:1,display:"grid",gap:10 }}>
              {[
                { label:"Necesidades", spent:needsSpent, budget:needsBudget, color:C.needs },
                { label:"Deseos", spent:wantsSpent, budget:wantsBudget, color:C.wants },
                { label:"Compromisos", spent:commitmentTotal, budget:commitmentTotal, color:C.commit },
                { label:"Ahorros", spent:Math.max(0,savingsBudget-monthSavings), budget:savingsBudget, color:C.savings },
              ].map((row,i) => (
                <div key={i}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <div style={{ width:8,height:8,borderRadius:2,background:row.color,flexShrink:0 }}/>
                      <span style={{ fontSize:11,color:C.muted,fontFamily:FONT_BODY }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize:11,fontFamily:FONT_MONO,fontWeight:600,color:C.ink }}>{fmt(row.spent)}</span>
                  </div>
                  <ProgressBar value={row.spent} max={row.budget||1} color={row.color} height={5}/>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Savings + Emergency */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
        <Card style={{ background:`${C.savings}12`,border:`1px solid ${C.savings}25` }}>
          <div style={{ fontSize:10,color:C.savings,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",fontFamily:FONT_BODY,marginBottom:4 }}>Ahorros totales</div>
          <div style={{ fontFamily:FONT_DISPLAY,fontSize:24,fontWeight:800,color:C.savings }}>{fmt(totalSavings)}</div>
          <div style={{ fontSize:10,color:C.muted,marginTop:2,fontFamily:FONT_BODY }}>este mes: {fmt(monthSavings)}</div>
        </Card>
        <Card style={{ background:`${C.commit}12`,border:`1px solid ${C.commit}25` }}>
          <div style={{ fontSize:10,color:C.commit,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",fontFamily:FONT_BODY,marginBottom:4 }}>Compromisos</div>
          <div style={{ fontFamily:FONT_DISPLAY,fontSize:24,fontWeight:800,color:C.commit }}>{fmt(commitmentTotal)}</div>
          <div style={{ fontSize:10,color:C.muted,marginTop:2,fontFamily:FONT_BODY }}>{commitmentPct}% del ingreso</div>
        </Card>
      </div>

      {/* Emergency */}
      <button onClick={()=>setShowEmergency(true)} style={{
        width:"100%", border:`2px solid ${C.red}`, borderRadius:16,
        background:"transparent", color:C.red,
        fontFamily:FONT_BODY, fontWeight:700, fontSize:14,
        padding:"14px", cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,
      }}>
        <Zap size={16}/> Retiro de emergencia · {fmt(totalSavings)} disponibles
      </button>
    </div>
  );
}

// ── GASTOS SCREEN ─────────────────────────────────────────────────────────────
function GastosScreen({ data, derived, actions }) {
  const { inc, needsSpent, wantsSpent, needsBudget, wantsBudget } = derived;
  const { recurring, transactions, salary, extras } = data;
  const [newTx, setNewTx] = useState({ name:"", amount:"" });
  const [editTxId, setEditTxId] = useState(null);
  const [editTx, setEditTx] = useState({});
  const [showRecForm, setShowRecForm] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [newRec, setNewRec] = useState({ icon:"📋", label:"", amount:"", category:"needs" });
  const [editRecId, setEditRecId] = useState(null);
  const [editRec, setEditRec] = useState({});
  const [tab, setTab] = useState("recurrentes");

  return (
    <div style={{ padding:"0 16px 100px" }}>
      <div style={{ padding:"20px 0 16px" }}>
        <div style={{ fontFamily:FONT_DISPLAY,fontSize:26,fontWeight:800,color:C.ink }}>Gastos del mes</div>
        <div style={{ fontSize:13,color:C.muted,fontFamily:FONT_BODY }}>Necesidades y deseos</div>
      </div>

      {/* Budget summary */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
        {[
          { label:"Necesidades", spent:needsSpent, budget:needsBudget, color:C.needs },
          { label:"Deseos", spent:wantsSpent, budget:wantsBudget, color:C.wants },
        ].map((item,i)=>(
          <Card key={i}>
            <div style={{ fontSize:10,color:item.color,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",fontFamily:FONT_BODY,marginBottom:4 }}>{item.label}</div>
            <div style={{ fontFamily:FONT_MONO,fontSize:18,fontWeight:800,color:needsSpent>needsBudget&&i===0?C.red:wantsSpent>wantsBudget&&i===1?C.red:C.ink,marginBottom:6 }}>
              {fmt(item.budget - item.spent)}
              <span style={{ fontSize:11,fontWeight:400,color:C.muted }}> restante</span>
            </div>
            <ProgressBar value={item.spent} max={item.budget} color={item.color}/>
            <div style={{ fontSize:10,color:C.muted,marginTop:4,fontFamily:FONT_BODY }}>{fmt(item.spent)} / {fmt(item.budget)}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:16,background:C.card,borderRadius:14,padding:4 }}>
        {[{id:"recurrentes",label:"Recurrentes"},{ id:"puntuales",label:"Puntuales"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1,border:"none",borderRadius:10,fontFamily:FONT_BODY,fontSize:13,fontWeight:600,
            padding:"9px 0",cursor:"pointer",transition:"all 0.2s",
            background:tab===t.id?C.surface:"transparent",
            color:tab===t.id?C.ink:C.muted,
            boxShadow:tab===t.id?"0 1px 4px rgba(0,0,0,0.08)":"none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Recurrentes tab */}
      {tab==="recurrentes" && (
        <div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
            <div style={{ fontSize:13,fontWeight:600,color:C.ink,fontFamily:FONT_BODY }}>Gastos fijos mensuales</div>
            <div style={{ display:"flex",gap:8 }}>
              <Btn small outline onClick={()=>{ setShowQuick(p=>!p); setShowRecForm(false); }}>Plantillas</Btn>
              <Btn small onClick={()=>{ setShowRecForm(p=>!p); setShowQuick(false); }}>+ Agregar</Btn>
            </div>
          </div>

          {showQuick && (
            <Card style={{ marginBottom:12, padding:16 }}>
              <div style={{ fontSize:10,color:C.muted,letterSpacing:0.8,textTransform:"uppercase",fontFamily:FONT_BODY,marginBottom:10 }}>Toca para agregar</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                {QUICK_NEEDS.filter(t=>!recurring.find(r=>r.label===t.label)).map(tpl=>(
                  <button key={tpl.label} onClick={()=>{ actions.addFromTpl(tpl); setShowQuick(false); }}
                    style={{ border:`1.5px solid ${C.needs}30`,borderRadius:20,background:`${C.needs}08`,color:C.needs,fontFamily:FONT_BODY,fontSize:12,fontWeight:600,padding:"7px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}>
                    {tpl.icon} {tpl.label}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {showRecForm && (
            <Card style={{ marginBottom:12, padding:16 }}>
              <div style={{ display:"grid",gap:10 }}>
                <div style={{ display:"grid",gridTemplateColumns:"40px 1fr 90px",gap:8 }}>
                  <Field value={newRec.icon} onChange={e=>setNewRec(p=>({...p,icon:e.target.value}))} style={{ }} />
                  <Field placeholder="Nombre del gasto" value={newRec.label} onChange={e=>setNewRec(p=>({...p,label:e.target.value}))}/>
                  <Field type="number" placeholder="$" prefix="$" value={newRec.amount} onChange={e=>setNewRec(p=>({...p,amount:e.target.value}))}/>
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  {[{val:"needs",label:"Necesidad",color:C.needs},{val:"wants",label:"Deseo",color:C.wants}].map(opt=>(
                    <button key={opt.val} onClick={()=>setNewRec(p=>({...p,category:opt.val}))} style={{
                      flex:1,border:`1.5px solid ${newRec.category===opt.val?opt.color:C.border}`,
                      borderRadius:10,background:newRec.category===opt.val?`${opt.color}15`:"transparent",
                      color:newRec.category===opt.val?opt.color:C.muted,
                      fontFamily:FONT_BODY,fontSize:12,fontWeight:600,padding:"8px 0",cursor:"pointer",
                    }}>{opt.label}</button>
                  ))}
                </div>
                <Btn onClick={()=>{ actions.addRec(newRec); setNewRec({icon:"📋",label:"",amount:"",category:"needs"}); setShowRecForm(false); }} color={newRec.category==="wants"?C.wants:C.needs}>
                  {newRec.category==="wants"?"Agregar deseo":"Agregar necesidad"}
                </Btn>
              </div>
            </Card>
          )}

          {recurring.map(r=>(
            <Card key={r.id} style={{ marginBottom:8, padding:"14px 16px" }}>
              {editRecId===r.id ? (
                <div style={{ display:"grid",gridTemplateColumns:"40px 1fr 90px 32px",gap:8,alignItems:"center" }}>
                  <input value={editRec.icon} onChange={e=>setEditRec(p=>({...p,icon:e.target.value}))} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,padding:"6px",fontSize:18,textAlign:"center",background:C.bg,outline:"none" }}/>
                  <input value={editRec.label} onChange={e=>setEditRec(p=>({...p,label:e.target.value}))} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontFamily:FONT_BODY,fontSize:13,background:C.bg,outline:"none" }}/>
                  <input type="number" value={editRec.amount} onChange={e=>setEditRec(p=>({...p,amount:e.target.value}))} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,padding:"8px",fontFamily:FONT_MONO,fontSize:13,background:C.bg,outline:"none",textAlign:"right" }}/>
                  <button onClick={()=>{ actions.saveRec(r.id,editRec); setEditRecId(null); }} style={{ border:"none",background:C.green,borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><Check size={14} color="white"/></button>
                </div>
              ) : (
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <span style={{ fontSize:20 }}>{r.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:600,color:C.ink,fontFamily:FONT_BODY }}>{r.label}</div>
                    <Pill color={r.category==="wants"?C.wants:C.needs} small>{r.category==="wants"?"Deseo":"Necesidad"}</Pill>
                  </div>
                  <button onClick={()=>actions.toggleRec(r.id)} style={{
                    border:`1.5px solid ${r.active?C.needs:C.border}`,
                    borderRadius:8,background:r.active?`${C.needs}15`:"transparent",
                    color:r.active?C.needs:C.muted,
                    fontFamily:FONT_BODY,fontSize:11,fontWeight:600,
                    padding:"4px 10px",cursor:"pointer",
                  }}>{r.active?"ON":"OFF"}</button>
                  <div style={{ fontFamily:FONT_MONO,fontSize:15,fontWeight:700,color:r.active?C.ink:C.muted,minWidth:60,textAlign:"right" }}>
                    {+r.amount>0 ? fmt(r.amount) : <span style={{ color:C.border,fontSize:12 }}>sin monto</span>}
                  </div>
                  <div style={{ display:"flex",gap:4 }}>
                    <button onClick={()=>{ setEditRecId(r.id); setEditRec({icon:r.icon,label:r.label,amount:r.amount}); }} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:"6px",cursor:"pointer",display:"flex",alignItems:"center" }}><Pencil size={12} color={C.muted}/></button>
                    <button onClick={()=>actions.delRec(r.id)} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:"6px",cursor:"pointer",display:"flex",alignItems:"center" }}><Trash2 size={12} color={C.red}/></button>
                  </div>
                </div>
              )}
            </Card>
          ))}

          {recurring.length===0 && !showQuick && !showRecForm && (
            <div style={{ textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0",fontFamily:FONT_BODY }}>Agrega tus gastos fijos: renta, luz, agua...</div>
          )}
        </div>
      )}

      {/* Puntuales tab */}
      {tab==="puntuales" && (
        <div>
          {/* Add tx */}
          <Card style={{ marginBottom:12, padding:16 }}>
            <div style={{ display:"grid",gap:10 }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 90px",gap:8 }}>
                <Field placeholder="Pizza, taxis, ropa..." value={newTx.name} onChange={e=>setNewTx(p=>({...p,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&actions.addTx(newTx,setNewTx)}/>
                <Field type="number" placeholder="$" prefix="$" value={newTx.amount} onChange={e=>setNewTx(p=>({...p,amount:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&actions.addTx(newTx,setNewTx)}/>
              </div>
              {newTx.name && (
                <div style={{ fontSize:11,color:C.muted,fontFamily:FONT_BODY }}>
                  Auto-categoría: <Pill color={autoCat(newTx.name)==="needs"?C.needs:C.wants} small>
                    {autoCat(newTx.name)==="needs"?"Necesidad":"Deseo"}
                  </Pill>
                </div>
              )}
              <Btn onClick={()=>actions.addTx(newTx,setNewTx)}>+ Agregar gasto</Btn>
            </div>
          </Card>

          {transactions.map((tx,i)=>(
            <Card key={tx.id} style={{ marginBottom:8, padding:"14px 16px" }}>
              {editTxId===tx.id ? (
                <div style={{ display:"grid",gridTemplateColumns:"1fr 90px 80px 32px",gap:8,alignItems:"center" }}>
                  <input value={editTx.name} onChange={e=>setEditTx(p=>({...p,name:e.target.value}))} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontFamily:FONT_BODY,fontSize:13,background:C.bg,outline:"none" }}/>
                  <input type="number" value={editTx.amount} onChange={e=>setEditTx(p=>({...p,amount:e.target.value}))} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,padding:"8px",fontFamily:FONT_MONO,fontSize:13,background:C.bg,outline:"none",textAlign:"right" }}/>
                  <select value={editTx.category} onChange={e=>setEditTx(p=>({...p,category:e.target.value}))} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,padding:"8px",fontFamily:FONT_BODY,fontSize:12,background:C.bg,outline:"none" }}>
                    <option value="needs">Necesidad</option>
                    <option value="wants">Deseo</option>
                  </select>
                  <button onClick={()=>{ actions.saveTx(tx.id,editTx); setEditTxId(null); }} style={{ border:"none",background:C.green,borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><Check size={14} color="white"/></button>
                </div>
              ) : (
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:600,color:C.ink,fontFamily:FONT_BODY }}>{tx.name}</div>
                    <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:2 }}>
                      <span style={{ fontSize:10,color:C.muted,fontFamily:FONT_BODY }}>{tx.date}</span>
                      <Pill color={tx.category==="needs"?C.needs:C.wants} small>{tx.category==="needs"?"Necesidad":"Deseo"}</Pill>
                    </div>
                  </div>
                  <div style={{ fontFamily:FONT_MONO,fontSize:16,fontWeight:700,color:C.ink }}>-{fmt(tx.amount)}</div>
                  <div style={{ display:"flex",gap:4 }}>
                    <button onClick={()=>{ setEditTxId(tx.id); setEditTx({name:tx.name,amount:tx.amount,category:tx.category}); }} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:"6px",cursor:"pointer",display:"flex",alignItems:"center" }}><Pencil size={12} color={C.muted}/></button>
                    <button onClick={()=>actions.delTx(tx.id)} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:"6px",cursor:"pointer",display:"flex",alignItems:"center" }}><Trash2 size={12} color={C.red}/></button>
                  </div>
                </div>
              )}
            </Card>
          ))}

          {transactions.length===0 && (
            <div style={{ textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0",fontFamily:FONT_BODY }}>Sin gastos puntuales este mes</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── COMPROMISOS SCREEN ────────────────────────────────────────────────────────
function CompromisosScreen({ data, derived, actions }) {
  const { commitments } = data;
  const { commitmentTotal, inc } = derived;
  const [showForm, setShowForm] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState(null);
  const [amortItem, setAmortItem] = useState(null);

  const subs    = commitments.filter(c=>c.type==="subscription");
  const deferred = commitments.filter(c=>c.type==="deferred");
  const loans   = commitments.filter(c=>c.type==="loan");

  const typeLabel = t => t==="subscription"?"Suscripción":t==="deferred"?"Diferido":"Préstamo";
  const typeIcon  = t => t==="subscription"?"🔄":t==="deferred"?"💳":"🏦";

  return (
    <div style={{ padding:"0 16px 100px" }}>
      {showForm && (
        <CommitmentForm
          editing={editingCommitment}
          onAdd={c=>{ actions.addCommitment(c); setEditingCommitment(null); }}
          onClose={()=>{ setShowForm(false); setEditingCommitment(null); }}
        />
      )}
      {amortItem && <AmortizationTable item={amortItem} onClose={()=>setAmortItem(null)}/>}

      <div style={{ padding:"20px 0 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:FONT_DISPLAY,fontSize:26,fontWeight:800,color:C.ink }}>Compromisos</div>
          <div style={{ fontSize:13,color:C.muted,fontFamily:FONT_BODY }}>Suscripciones · Diferidos · Préstamos</div>
        </div>
        <Btn onClick={()=>{ setEditingCommitment(null); setShowForm(true); }} color={C.commit}>+ Nuevo</Btn>
      </div>

      {/* Total impact */}
      <Card style={{ background:`${C.commit}10`,border:`1px solid ${C.commit}20`,marginBottom:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10,color:C.commit,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",fontFamily:FONT_BODY,marginBottom:4 }}>Impacto mensual total</div>
            <div style={{ fontFamily:FONT_DISPLAY,fontSize:32,fontWeight:800,color:C.commit }}>{fmt(commitmentTotal)}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:FONT_MONO,fontSize:28,fontWeight:800,color:C.commit }}>
              {inc>0 ? Math.round(commitmentTotal/inc*100) : 0}%
            </div>
            <div style={{ fontSize:11,color:C.muted,fontFamily:FONT_BODY }}>de tu ingreso</div>
          </div>
        </div>
        {inc > 0 && <div style={{ marginTop:12 }}><ProgressBar value={commitmentTotal} max={inc} color={C.commit} height={8}/></div>}
      </Card>

      {/* Groups */}
      {[
        { label:"Suscripciones", items:subs, color:C.commit, icon:"🔄" },
        { label:"Diferidos (cuotas)", items:deferred, color:C.commit, icon:"💳" },
        { label:"Préstamos", items:loans, color:C.commit, icon:"🏦" },
      ].map(group => group.items.length > 0 && (
        <div key={group.label} style={{ marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
            <span style={{ fontSize:16 }}>{group.icon}</span>
            <div style={{ fontFamily:FONT_BODY,fontSize:13,fontWeight:700,color:C.ink }}>{group.label}</div>
            <div style={{ fontSize:12,color:group.color,fontFamily:FONT_MONO,fontWeight:600 }}>
              {fmt(group.items.reduce((s,c)=>s+c.monthly,0))}/mes
            </div>
          </div>

          {group.items.map(c => (
            <Card key={c.id} style={{ marginBottom:8, padding:"16px 18px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
                <div style={{ fontSize:22,flexShrink:0 }}>{typeIcon(c.type)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
                    <div style={{ fontFamily:FONT_BODY,fontSize:15,fontWeight:700,color:C.ink }}>{c.name}</div>
                    <div style={{ fontFamily:FONT_MONO,fontSize:17,fontWeight:800,color:C.commit }}>-{fmt(c.monthly)}/mes</div>
                  </div>

                  {(c.type==="deferred"||c.type==="loan") && c.quotas && (
                    <div>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                        <div style={{ fontSize:11,color:C.muted,fontFamily:FONT_BODY }}>
                          {c.paid}/{c.quotas} cuotas · {fmt(c.monthly*(c.quotas-c.paid))} restante
                        </div>
                        <button onClick={()=>setAmortItem(c)} style={{ border:`1px solid ${C.commit}40`,borderRadius:8,background:`${C.commit}10`,color:C.commit,fontFamily:FONT_BODY,fontSize:10,fontWeight:600,padding:"3px 9px",cursor:"pointer" }}>
                          Ver tabla
                        </button>
                      </div>
                      <ProgressBar value={c.paid} max={c.quotas} color={C.commit}/>
                      <div style={{ display:"flex",justifyContent:"space-between",marginTop:4 }}>
                        <span style={{ fontSize:10,color:C.muted,fontFamily:FONT_BODY }}>Pagado: {fmt(c.monthly*c.paid)}</span>
                        <span style={{ fontSize:10,color:C.muted,fontFamily:FONT_BODY }}>Total: {fmt(c.monthly*c.quotas)}</span>
                      </div>
                    </div>
                  )}

                  {c.notes && <div style={{ fontSize:11,color:C.muted,fontFamily:FONT_BODY,marginTop:6 }}>{c.notes}</div>}
                </div>
              </div>

              <div style={{ display:"flex",justifyContent:"flex-end",gap:8,marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}` }}>
                <button onClick={()=>{ setEditingCommitment(c); setShowForm(true); }}
                  style={{ border:`1.5px solid ${C.border}`,borderRadius:10,background:"transparent",padding:"7px 14px",cursor:"pointer",fontFamily:FONT_BODY,fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:5 }}>
                  <Pencil size={12}/> Editar
                </button>
                <button onClick={()=>actions.delCommitment(c.id)}
                  style={{ border:`1.5px solid ${C.red}25`,borderRadius:10,background:`${C.red}08`,padding:"7px 14px",cursor:"pointer",fontFamily:FONT_BODY,fontSize:12,color:C.red,display:"flex",alignItems:"center",gap:5 }}>
                  <Trash2 size={12}/> Eliminar
                </button>
              </div>
            </Card>
          ))}
        </div>
      ))}

      {commitments.length===0 && (
        <div style={{ textAlign:"center",padding:"48px 20px" }}>
          <div style={{ fontSize:36,marginBottom:12 }}>💳</div>
          <div style={{ fontFamily:FONT_DISPLAY,fontSize:18,fontWeight:700,color:C.ink,marginBottom:6 }}>Sin compromisos</div>
          <div style={{ fontSize:13,color:C.muted,fontFamily:FONT_BODY,marginBottom:20 }}>Agrega tus suscripciones, pagos a meses y préstamos</div>
          <Btn onClick={()=>setShowForm(true)} color={C.commit}>Agregar primer compromiso</Btn>
        </div>
      )}
    </div>
  );
}

// ── CONFIG SCREEN ─────────────────────────────────────────────────────────────
function ConfigScreen({ data, actions }) {
  const { salary, extras, rule, custom } = data;
  const [newExtra, setNewExtra] = useState({ label:"", amount:"" });
  const [editExtId, setEditExtId] = useState(null);
  const [editExt, setEditExt] = useState({});

  const noSalary = !parseFloat(salary);

  return (
    <div style={{ padding:"0 16px 100px" }}>
      <div style={{ padding:"20px 0 16px" }}>
        <div style={{ fontFamily:FONT_DISPLAY,fontSize:26,fontWeight:800,color:C.ink }}>Configuración</div>
        <div style={{ fontSize:13,color:C.muted,fontFamily:FONT_BODY }}>Ingresos y regla presupuestal</div>
      </div>

      {/* Salary */}
      <Card style={{ marginBottom:16, background: noSalary ? `${C.yellow}15` : C.surface, border: noSalary ? `1.5px solid ${C.yellow}` : "none" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
          <div style={{ fontFamily:FONT_BODY,fontSize:14,fontWeight:700,color:C.ink }}>💰 Sueldo mensual</div>
          {noSalary && <Pill color={C.yellow}>Pendiente</Pill>}
        </div>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:20,fontFamily:FONT_MONO,color:C.muted,pointerEvents:"none" }}>$</span>
          <input type="number" value={salary} onChange={e=>actions.setSalary(e.target.value)} placeholder="0"
            style={{ width:"100%",border:`1.5px solid ${noSalary?C.yellow:C.border}`,borderRadius:14,background:C.bg,fontFamily:FONT_MONO,fontSize:32,fontWeight:800,color:C.ink,padding:"12px 16px 12px 36px",outline:"none",boxSizing:"border-box" }}/>
        </div>
      </Card>

      {/* Extras */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontFamily:FONT_BODY,fontSize:14,fontWeight:700,color:C.ink,marginBottom:14 }}>+ Ingresos extra</div>

        {extras.map(e=>(
          <div key={e.id} style={{ marginBottom:8 }}>
            {editExtId===e.id ? (
              <div style={{ display:"grid",gridTemplateColumns:"1fr 90px 32px",gap:8 }}>
                <input value={editExt.label} onChange={ev=>setEditExt(p=>({...p,label:ev.target.value}))} style={{ border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 12px",fontFamily:FONT_BODY,fontSize:13,background:C.bg,outline:"none" }}/>
                <input type="number" value={editExt.amount} onChange={ev=>setEditExt(p=>({...p,amount:ev.target.value}))} style={{ border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px",fontFamily:FONT_MONO,fontSize:13,background:C.bg,outline:"none",textAlign:"right" }}/>
                <button onClick={()=>{ actions.saveExtra(e.id,editExt); setEditExtId(null); }} style={{ border:"none",background:C.green,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><Check size={14} color="white"/></button>
              </div>
            ) : (
              <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.bg,borderRadius:12 }}>
                <div style={{ width:4,height:28,background:C.yellow,borderRadius:2,flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12,color:C.muted,fontFamily:FONT_BODY }}>{e.label}</div>
                  <div style={{ fontFamily:FONT_MONO,fontSize:15,fontWeight:700,color:C.ink }}>{fmt(e.amount)}</div>
                </div>
                <button onClick={()=>{ setEditExtId(e.id);setEditExt({label:e.label,amount:e.amount}); }} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:"6px",cursor:"pointer",display:"flex" }}><Pencil size={12} color={C.muted}/></button>
                <button onClick={()=>actions.delExtra(e.id)} style={{ border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:"6px",cursor:"pointer",display:"flex" }}><Trash2 size={12} color={C.red}/></button>
              </div>
            )}
          </div>
        ))}

        <div style={{ display:"grid",gridTemplateColumns:"1fr 90px 36px",gap:8,marginTop:8 }}>
          <input placeholder="Freelance, bono..." value={newExtra.label} onChange={e=>setNewExtra(p=>({...p,label:e.target.value}))} style={{ border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",fontFamily:FONT_BODY,fontSize:13,background:C.bg,outline:"none" }}/>
          <input type="number" placeholder="$" value={newExtra.amount} onChange={e=>setNewExtra(p=>({...p,amount:e.target.value}))} style={{ border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px",fontFamily:FONT_MONO,fontSize:13,background:C.bg,outline:"none",textAlign:"right" }}/>
          <button onClick={()=>{ actions.addExtra(newExtra); setNewExtra({label:"",amount:""}); }}
            style={{ border:"none",background:C.ink,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
            <Plus size={16} color="white"/>
          </button>
        </div>
      </Card>

      {/* Rule */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontFamily:FONT_BODY,fontSize:14,fontWeight:700,color:C.ink,marginBottom:14 }}>Regla presupuestal</div>
        <div style={{ display:"grid",gap:8 }}>
          {Object.keys(RULES).map((r,i)=>{
            const colors=[C.needs,C.wants,C.savings];
            return (
              <button key={r} onClick={()=>actions.setRule(r)} style={{
                border:`1.5px solid ${rule===r?colors[i]:C.border}`,
                borderRadius:12,background:rule===r?`${colors[i]}12`:"transparent",
                padding:"12px 16px",cursor:"pointer",textAlign:"left",
                display:"flex",alignItems:"center",justifyContent:"space-between",
                fontFamily:FONT_BODY,fontSize:14,color:rule===r?colors[i]:C.ink,fontWeight:rule===r?700:500,
                transition:"all 0.15s",
              }}>
                <span>{r}</span>
                {rule===r && <Check size={16}/>}
              </button>
            );
          })}
        </div>

        {rule==="Personalizado" && (
          <div style={{ marginTop:14,display:"grid",gap:10 }}>
            {[["needs","Necesidades",C.needs],["wants","Deseos",C.wants],["savings","Ahorros",C.savings]].map(([k,label,color])=>(
              <div key={k} style={{ display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:10,height:10,borderRadius:2,background:color,flexShrink:0 }}/>
                <Field label={label} type="number" suffix="%" value={custom[k]} onChange={e=>actions.setCustom(p=>({...p,[k]:+e.target.value}))} style={{ flex:1 }}/>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Color legend */}
      <Card>
        <div style={{ fontFamily:FONT_BODY,fontSize:14,fontWeight:700,color:C.ink,marginBottom:12 }}>Categorías</div>
        {[
          { label:"Necesidades", desc:"Renta, servicios, comida básica", color:C.needs },
          { label:"Deseos", desc:"Salidas, entretenimiento, ropa", color:C.wants },
          { label:"Compromisos", desc:"Suscripciones, diferidos, préstamos", color:C.commit },
          { label:"Ahorros", desc:"Fondo de emergencia y ahorro libre", color:C.savings },
        ].map(item=>(
          <div key={item.label} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
            <div style={{ width:12,height:12,borderRadius:3,background:item.color,flexShrink:0 }}/>
            <div>
              <div style={{ fontSize:13,fontWeight:600,color:C.ink,fontFamily:FONT_BODY }}>{item.label}</div>
              <div style={{ fontSize:11,color:C.muted,fontFamily:FONT_BODY }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ROOT APP ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function Sincopa() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");

  // ── state ──
  const now = new Date();
  const [currentYear,  setCurrentYear]  = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()+1);
  const [salary,       setSalary]       = useState("");
  const [extras,       setExtras]       = useState([]);
  const [rule,         setRule]         = useState("50/30/20");
  const [custom,       setCustom]       = useState({ needs:50,wants:30,savings:20 });
  const [recurring,    setRecurring]    = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [commitments,  setCommitments]  = useState([]);   // subs + deferred + loans
  const [history,      setHistory]      = useState([]);
  const [totalSavingsAccum, setTotalSavingsAccum] = useState(0);
  const [withdrawn,    setWithdrawn]    = useState(0);

  // ── load ──
  useEffect(()=>{
    const d = loadData();
    if(d && Object.keys(d).length) {
      if(d.salary!==undefined)    setSalary(d.salary);
      if(d.extras)                setExtras(d.extras);
      if(d.rule)                  setRule(d.rule);
      if(d.custom)                setCustom(d.custom);
      if(d.recurring)             setRecurring(d.recurring);
      if(d.transactions)          setTransactions(d.transactions);
      if(d.commitments)           setCommitments(d.commitments);
      if(d.history)               setHistory(d.history);
      if(d.totalSavingsAccum !== undefined) setTotalSavingsAccum(d.totalSavingsAccum);
      if(d.withdrawn !== undefined)         setWithdrawn(d.withdrawn);
      if(d.currentYear)           setCurrentYear(d.currentYear);
      if(d.currentMonth)          setCurrentMonth(d.currentMonth);
    }
    setLoading(false);
  },[]);

  // ── save on every change ──
  const stateRef = useRef({});
  useEffect(()=>{
    if(loading) return;
    const data = { salary,extras,rule,custom,recurring,transactions,commitments,history,totalSavingsAccum,withdrawn,currentYear,currentMonth };
    stateRef.current = data;
    saveData(data);
  },[salary,extras,rule,custom,recurring,transactions,commitments,history,totalSavingsAccum,withdrawn,currentYear,currentMonth,loading]);

  // ── derived ──
  const salaryVal = parseFloat(salary)||0;
  const inc = salaryVal + extras.reduce((s,e)=>s+(+e.amount||0),0);
  const activeRule    = rule==="Personalizado"?custom:RULES[rule];
  const needsBudget   = inc*activeRule.needs/100;
  const wantsBudget   = inc*activeRule.wants/100;
  const savingsBudget = inc*activeRule.savings/100;

  const activeRec  = recurring.filter(r=>r.active&&+r.amount>0);
  const recNeeds   = activeRec.filter(r=>r.category!=="wants").reduce((s,r)=>s+(+r.amount),0);
  const recWants   = activeRec.filter(r=>r.category==="wants").reduce((s,r)=>s+(+r.amount),0);
  const txNeeds    = transactions.filter(t=>t.category==="needs").reduce((s,t)=>s+t.amount,0);
  const txWants    = transactions.filter(t=>t.category==="wants").reduce((s,t)=>s+t.amount,0);

  const commitmentTotal = commitments.filter(c=>c.active!==false).reduce((s,c)=>s+(+c.monthly||0),0);
  const commitmentPct   = inc>0 ? Math.round(commitmentTotal/inc*100) : 0;

  const needsSpent   = recNeeds + txNeeds;
  // compromisos descuentan del 30% de deseos
  const wantsSpent   = recWants + txWants + commitmentTotal;
  const savingsSpent = 0;
  const monthSavings = Math.max(0, savingsBudget);
  const totalSavings = totalSavingsAccum + monthSavings - withdrawn;
  const totalBalance = inc - needsSpent - wantsSpent - savingsBudget;
  const overNeeds    = inc>0 && needsSpent>needsBudget;
  const overWants    = inc>0 && wantsSpent>wantsBudget;
  const isNeg        = totalBalance<0;

  const derived = { inc,needsSpent,wantsSpent,savingsSpent,needsBudget,wantsBudget,savingsBudget,
    totalBalance,monthSavings,totalSavings,commitmentTotal,overNeeds,overWants,isNeg,activeRule,commitmentPct };

  const data = { currentMonth,currentYear,salary,extras,rule,custom,recurring,transactions,commitments,history };

  // ── actions ──
  const actions = {
    setSalary,
    setRule,
    setCustom,
    addExtra: e=>{ if(!e.label||!e.amount) return; setExtras(p=>[...p,{id:Date.now(),label:e.label,amount:+e.amount}]); },
    delExtra: id=>setExtras(p=>p.filter(e=>e.id!==id)),
    saveExtra:(id,ed)=>setExtras(p=>p.map(e=>e.id===id?{...e,...ed,amount:+ed.amount}:e)),
    toggleRec: id=>setRecurring(p=>p.map(r=>r.id===id?{...r,active:!r.active}:r)),
    delRec: id=>setRecurring(p=>p.filter(r=>r.id!==id)),
    saveRec:(id,ed)=>setRecurring(p=>p.map(r=>r.id===id?{...r,...ed,amount:+ed.amount}:r)),
    addRec: r=>{ if(!r.label) return; setRecurring(p=>[...p,{id:Date.now(),icon:r.icon||"📋",label:r.label,amount:+r.amount||0,category:r.category||"needs",active:true}]); },
    addFromTpl: tpl=>setRecurring(p=>[...p,{id:Date.now(),icon:tpl.icon,label:tpl.label,amount:0,category:"needs",active:true}]),
    addTx:(tx,reset)=>{ if(!tx.name||!tx.amount) return; setTransactions(p=>[...p,{id:Date.now(),name:tx.name,amount:+tx.amount,category:autoCat(tx.name),date:new Date().toLocaleDateString("es-MX",{month:"short",day:"2-digit"})}]); reset({name:"",amount:""}); },
    delTx: id=>setTransactions(p=>p.filter(t=>t.id!==id)),
    saveTx:(id,ed)=>setTransactions(p=>p.map(t=>t.id===id?{...t,...ed,amount:+ed.amount}:t)),
    addCommitment: c=>setCommitments(p=>{ const exists=p.find(x=>x.id===c.id); return exists?p.map(x=>x.id===c.id?c:x):[...p,c]; }),
    delCommitment: id=>setCommitments(p=>p.filter(c=>c.id!==id)),
    withdraw: amt=>setWithdrawn(p=>p+amt),
    doRollover: ()=>{
      const nm=currentMonth===12?1:currentMonth+1;
      const ny=currentMonth===12?currentYear+1:currentYear;
      const newAccum = totalSavingsAccum + monthSavings;
      // advance deferred commitments
      const newCommitments = commitments.map(c=>{
        if((c.type==="deferred"||c.type==="loan")&&c.quotas!=null){
          const newPaid = Math.min((c.paid||0)+1, c.quotas);
          return { ...c, paid:newPaid };
        }
        return c;
      }).filter(c=>!(c.quotas!=null && c.paid>=c.quotas));
      setHistory(p=>[...p,{ year:currentYear,month:currentMonth,salary,extras,rule,custom,recurring,transactions,commitments }]);
      setTransactions([]);
      setCommitments(newCommitments);
      setTotalSavingsAccum(newAccum);
      setWithdrawn(0);
      setCurrentMonth(nm);
      setCurrentYear(ny);
    },
  };

  if(loading) return (
    <div style={{ background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ fontFamily:FONT_DISPLAY,fontSize:22,fontWeight:700,color:C.ink }}>Cargando Síncopa...</div>
    </div>
  );

  const TABS = [
    { id:"home",       icon:Home,     label:"Inicio"      },
    { id:"gastos",     icon:List,     label:"Gastos"      },
    { id:"compromisos",icon:Layers,   label:"Compromisos" },
    { id:"config",     icon:Settings, label:"Config"      },
  ];

  return (
    <div style={{ background:C.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", position:"relative", fontFamily:FONT_BODY }}>

      {/* Scrollable content */}
      <div style={{ minHeight:"100vh", paddingBottom:80 }}>
        {tab==="home"        && <HomeScreen        data={data} derived={derived} actions={actions}/>}
        {tab==="gastos"      && <GastosScreen      data={data} derived={derived} actions={actions}/>}
        {tab==="compromisos" && <CompromisosScreen data={data} derived={derived} actions={actions}/>}
        {tab==="config"      && <ConfigScreen      data={data} actions={actions}/>}
      </div>

      {/* Bottom nav */}
      <div style={{
        position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:480,
        background:C.surface,
        borderTop:`1px solid ${C.border}`,
        display:"grid", gridTemplateColumns:"repeat(4,1fr)",
        padding:"8px 0 env(safe-area-inset-bottom, 12px)",
        zIndex:100,
        boxShadow:"0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        {TABS.map(t=>{
          const Icon = t.icon;
          const active = tab===t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              border:"none",background:"none",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              padding:"6px 0",
            }}>
              <div style={{
                width:40,height:28,borderRadius:20,
                background:active?`${C.commit}15`:"transparent",
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:"all 0.2s",
              }}>
                <Icon size={18} color={active?C.commit:C.muted} strokeWidth={active?2.5:1.8}/>
              </div>
              <span style={{ fontSize:10,fontWeight:active?700:400,color:active?C.commit:C.muted,fontFamily:FONT_BODY,letterSpacing:0.2 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
