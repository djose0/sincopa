import { useState, useEffect, useRef } from "react";
import { Plus, X, Pencil, Check, Trash2, Archive, Zap, Home, List, Settings, Layers, LogOut, Copy, RefreshCw } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://fjxuijmagvrmavtrpqix.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeHVpam1hZ3ZybWF2dHJwcWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDc4MzksImV4cCI6MjA4NzEyMzgzOX0.e6l885GBtxAO59-4PjoTgEaBc9DkIa3dzyOF63Edfv0";

const SB = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#FAF8F4", surface:"#FFFFFF", card:"#F4F1EB",
  ink:"#1A1A1A", muted:"#8A8A8A", border:"#E8E4DC",
  needs:"#2E4DA0", wants:"#E8652A", commit:"#7C3AED", savings:"#2D6A4F",
  yellow:"#F2B830", red:"#D63C2F",
};
const FD = "'Georgia','Times New Roman',serif";
const FB = "system-ui,-apple-system,sans-serif";
const FM = "'SF Mono','Fira Code',monospace";

const RULES = {
  "50/30/20": { needs:50, wants:30, savings:20 },
  "50/25/25": { needs:50, wants:25, savings:25 },
  "Personalizado": { needs:50, wants:30, savings:20 },
};
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const NEEDS_KW = ["renta","alquiler","luz","agua","gas","internet","seguro","salud","médico","supermercado","gasolina","hipoteca","farmacia","celular","plan"];
const WANTS_KW = ["pizza","restaurante","café","bar","netflix","spotify","ropa","viaje","hotel","concierto","cine","amazon","uber","rappi","mall","gym","cerveza"];
const QUICK = [
  {icon:"🏠",label:"Renta / Hipoteca"},{icon:"💡",label:"Luz"},{icon:"💧",label:"Agua"},
  {icon:"🔥",label:"Gas"},{icon:"📡",label:"Internet"},{icon:"📱",label:"Plan Celular"},
  {icon:"🛒",label:"Supermercado"},{icon:"🏥",label:"Seguro Salud"},
];

const AVATARS = ["🐼","🦊","🐝","🦋","🐙","🦁","🐳","🦄","🐸","🌵","🍀","⭐"];

const autoCat = n => {
  const l = n.toLowerCase();
  if (NEEDS_KW.some(k => l.includes(k))) return "needs";
  if (WANTS_KW.some(k => l.includes(k))) return "wants";
  return "wants";
};
const fmt = n => "$" + Math.abs(+n||0).toLocaleString("es-MX", {minimumFractionDigits:0,maximumFractionDigits:0});
const todayStr = () => new Date().toLocaleDateString("es-MX", {day:"2-digit",month:"short",year:"numeric"});
const clamp = (v,min,max) => Math.min(Math.max(v,min),max);
const genCode = () => Math.random().toString(36).slice(2,8).toUpperCase();

const SESSION_KEY = "sincopa-session";
function loadSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; } }
function saveSession(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {} }
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch {} }

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{background:C.surface,borderRadius:20,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",cursor:onClick?"pointer":"default",...style}}>
      {children}
    </div>
  );
}

function Pill({ color, children, small }) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",background:color+"18",color,border:`1px solid ${color}30`,borderRadius:999,padding:small?"2px 8px":"3px 10px",fontSize:small?10:11,fontWeight:600,fontFamily:FB}}>
      {children}
    </span>
  );
}

function Bar({ value, max, color, h }) {
  const height = h || 8;
  const over = value > max && max > 0;
  const w = max > 0 ? clamp(Math.round(value/max*100),0,100) : 0;
  return (
    <div style={{background:C.border,borderRadius:999,height,overflow:"hidden"}}>
      <div style={{height:"100%",borderRadius:999,width:`${w}%`,background:over?C.red:color,transition:"width 0.4s ease"}}/>
    </div>
  );
}

function Btn({ children, onClick, color, outline, small, full, disabled, style }) {
  const bg = outline ? "transparent" : (color || C.ink);
  const fg = outline ? (color || C.ink) : "#fff";
  return (
    <button onClick={onClick} disabled={disabled} style={{border:`2px solid ${color||C.ink}`,borderRadius:small?10:14,background:bg,color:fg,fontFamily:FB,fontWeight:700,fontSize:small?12:14,padding:small?"7px 14px":"11px 20px",cursor:disabled?"default":"pointer",width:full?"100%":"auto",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:disabled?0.4:1,...style}}>
      {children}
    </button>
  );
}

const SI = { border:"1.5px solid #E8E4DC",borderRadius:8,padding:"8px 10px",fontFamily:FB,fontSize:13,color:"#1A1A1A",background:"#FAF8F4",outline:"none",boxSizing:"border-box",width:"100%" };

function Field({ label, value, onChange, type, placeholder, prefix, style }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4,...style}}>
      {label && <label style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,fontFamily:FB}}>{label}</label>}
      <div style={{position:"relative"}}>
        {prefix && <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.muted,pointerEvents:"none",fontFamily:FM}}>{prefix}</span>}
        <input type={type||"text"} value={value} onChange={onChange} placeholder={placeholder} style={{...SI,fontFamily:type==="number"?FM:FB,paddingLeft:prefix?"28px":"10px"}}/>
      </div>
    </div>
  );
}

function Avatar({ emoji, name, size }) {
  const sz = size || 32;
  return (
    <div style={{width:sz,height:sz,borderRadius:sz,background:C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:sz*0.55,flexShrink:0,border:`1.5px solid ${C.border}`,title:name}}>
      {emoji}
    </div>
  );
}

function AuthorTag({ profile }) {
  if (!profile) return null;
  return (
    <div style={{display:"flex",alignItems:"center",gap:5}}>
      <Avatar emoji={profile.avatar} name={profile.name} size={18}/>
      <span style={{fontSize:10,color:C.muted,fontFamily:FB}}>{profile.name}</span>
    </div>
  );
}

// ─── DONUT ────────────────────────────────────────────────────────────────────
function Donut({ segs, size }) {
  const sz = size || 150;
  const r = 52, cx = sz/2, cy = sz/2, sw = 20, circ = 2*Math.PI*r;
  const total = segs.reduce((s,g) => s+Math.max(0,+g.v||0),0) || 1;
  let off = 0;
  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{transform:"rotate(-90deg)"}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={sw}/>
      {segs.map((g,i) => {
        const v = Math.max(0,+g.v||0);
        if (v <= 0) return null;
        const dash = (v/total)*circ, gap = circ-dash, o = -(off/total)*circ;
        off += v;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={g.c} strokeWidth={sw} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={o} strokeLinecap="butt"/>;
      })}
    </svg>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode,     setMode]     = useState("login");  // login | register
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [avatar,   setAvatar]   = useState("🐼");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const isConfigured = SUPABASE_URL !== "https://TU_PROJECT_ID.supabase.co";

  async function handleSubmit() {
    if (!isConfigured) {
      setError("Primero configura tu URL y clave de Supabase en el código (líneas 16-17)");
      return;
    }
    if (!email || !password) { setError("Ingresa email y contraseña"); return; }
    if (mode==="register" && !name) { setError("Ingresa tu nombre"); return; }
    setLoading(true); setError("");
    try {
      if (mode === "register") {
        const { data, error: e } = await SB.auth.signUp({ email, password, options: { data: { name, avatar } } });
        if (e) { setError(e.message || "Error al registrarse"); setLoading(false); return; }
        setError(""); 
        setMode("login");
        setError("¡Cuenta creada! Revisa tu email para confirmar y luego inicia sesión.");
      } else {
        const { data, error: e } = await SB.auth.signInWithPassword({ email, password });
        if (e) { setError(e.message || "Email o contraseña incorrectos"); setLoading(false); return; }
        const s = { token: data.session.access_token, user: data.user };
        saveSession(s);
        onAuth(s);
      }
    } catch(err) {
      setError("Error de conexión. Verifica tu configuración de Supabase.");
    }
    setLoading(false);
  }

  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:380}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontFamily:FD,fontSize:42,fontWeight:800,color:C.ink,letterSpacing:-2,marginBottom:6}}>Síncopa</div>
          <div style={{fontSize:13,color:C.muted,fontFamily:FB}}>Control financiero compartido</div>
        </div>

        {!isConfigured && (
          <div style={{background:C.yellow+"20",border:`1.5px solid ${C.yellow}`,borderRadius:16,padding:"14px 18px",marginBottom:20}}>
            <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:C.ink,marginBottom:6}}>⚙️ Configuración pendiente</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:FB,lineHeight:1.6}}>
              Para usar Síncopa necesitas crear un proyecto en <strong>supabase.com</strong> y pegar tu URL y clave anónima en las líneas 16-17 del código.
            </div>
          </div>
        )}

        <Card style={{padding:"28px 24px"}}>
          {/* Mode toggle */}
          <div style={{display:"flex",gap:4,background:C.card,borderRadius:12,padding:4,marginBottom:24}}>
            {["login","register"].map(m => (
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,border:"none",borderRadius:8,fontFamily:FB,fontSize:13,fontWeight:600,padding:"9px 0",cursor:"pointer",background:mode===m?C.surface:"transparent",color:mode===m?C.ink:C.muted,boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.08)":"none"}}>
                {m==="login"?"Iniciar sesión":"Crear cuenta"}
              </button>
            ))}
          </div>

          <div style={{display:"grid",gap:14}}>
            {mode==="register" && (
              <div>
                <Field label="Tu nombre" value={name} onChange={e=>setName(e.target.value)} placeholder="Ana, Carlos..."/>
                <div style={{marginTop:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,fontFamily:FB,marginBottom:8}}>Tu avatar</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {AVATARS.map(a => (
                      <button key={a} onClick={()=>setAvatar(a)} style={{width:40,height:40,borderRadius:12,border:`2px solid ${avatar===a?C.commit:C.border}`,background:avatar===a?C.commit+"12":C.bg,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Field label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/>
            <Field label="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="mínimo 6 caracteres"/>

            {error && <div style={{background:C.red+"12",border:`1px solid ${C.red}30`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.red,fontFamily:FB}}>{error}</div>}

            <Btn onClick={handleSubmit} full color={C.commit} disabled={loading}>
              {loading ? "Cargando..." : mode==="login" ? "Entrar" : "Crear cuenta"}
            </Btn>
          </div>
        </Card>

        <div style={{textAlign:"center",marginTop:20,fontSize:11,color:C.muted,fontFamily:FB}}>
          Tus datos se sincronizan en todos tus dispositivos
        </div>
      </div>
    </div>
  );
}

// ─── HOUSEHOLD SCREEN ─────────────────────────────────────────────────────────
function HouseholdScreen({ session, onHousehold, onSignOut }) {
  const [mode,      setMode]      = useState("choose");   // choose | create | join
  const [houseName, setHouseName] = useState("");
  const [joinCode,  setJoinCode]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  async function createHousehold() {
    if (!houseName) { setError("Ponle un nombre a tu hogar"); return; }
    setLoading(true); setError("");
    const code = genCode();
    const now = new Date();
    const row = {
      name: houseName,
      invite_code: code,
      created_by: session.user.id,
      current_year: now.getFullYear(),
      current_month: now.getMonth()+1,
      rule: "50/30/20",
      custom_needs: 50, custom_wants: 30, custom_savings: 20,
      salary: 0,
      balance_carryover: 0,
      total_savings_accum: 0,
      withdrawn: 0,
    };
    const { data, error: e } = await SB.from("households").insert(row).select();
    if (e) { setError("Error al crear el hogar: " + e.message); setLoading(false); return; }
    const household = Array.isArray(data) ? data[0] : data;
    // Add self as member
    await SB.from("household_members").insert({
      household_id: household.id,
      user_id: session.user.id,
      name: session.user.user_metadata?.name || "Usuario",
      avatar: session.user.user_metadata?.avatar || "🐼",
      role: "admin",
    });
    onHousehold(household);
    setLoading(false);
  }

  async function joinHousehold() {
    if (!joinCode) { setError("Ingresa el código de invitación"); return; }
    setLoading(true); setError("");
    const { data, error: e } = await SB.from("households").select("*").eq("invite_code", joinCode.trim().toUpperCase());
    if (e || !data || data.length===0) { setError("Código no válido. Pídele el código a tu pareja."); setLoading(false); return; }
    const household = data[0];
    // Check not already member
    const { data: existing } = await SB.from("household_members").select("*").eq("household_id", household.id, user_id: session.user.id);
    if (!existing || existing.length===0) {
      await SB.from("household_members").insert({
        household_id: household.id,
        user_id: session.user.id,
        name: session.user.user_metadata?.name || "Usuario",
        avatar: session.user.user_metadata?.avatar || "🐼",
        role: "member",
      });
    }
    onHousehold(household);
    setLoading(false);
  }

  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:8}}>🏠</div>
          <div style={{fontFamily:FD,fontSize:26,fontWeight:800,color:C.ink,marginBottom:6}}>Tu hogar</div>
          <div style={{fontSize:13,color:C.muted,fontFamily:FB}}>Crea o únete a una cuenta hogar para compartir el presupuesto</div>
        </div>

        {mode==="choose" && (
          <div style={{display:"grid",gap:12}}>
            <Card style={{cursor:"pointer",border:`1.5px solid ${C.commit}20`}} onClick={()=>setMode("create")}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:48,height:48,borderRadius:16,background:C.commit+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>✨</div>
                <div>
                  <div style={{fontFamily:FB,fontSize:15,fontWeight:700,color:C.ink}}>Crear un hogar nuevo</div>
                  <div style={{fontSize:12,color:C.muted,fontFamily:FB,marginTop:2}}>Tú administras, invitas a tu pareja</div>
                </div>
              </div>
            </Card>
            <Card style={{cursor:"pointer",border:`1.5px solid ${C.savings}20`}} onClick={()=>setMode("join")}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:48,height:48,borderRadius:16,background:C.savings+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🔗</div>
                <div>
                  <div style={{fontFamily:FB,fontSize:15,fontWeight:700,color:C.ink}}>Unirme a un hogar</div>
                  <div style={{fontSize:12,color:C.muted,fontFamily:FB,marginTop:2}}>Tengo un código de invitación</div>
                </div>
              </div>
            </Card>
            <button onClick={onSignOut} style={{border:"none",background:"none",color:C.muted,fontFamily:FB,fontSize:12,cursor:"pointer",padding:"10px 0"}}>
              Cerrar sesión
            </button>
          </div>
        )}

        {mode==="create" && (
          <Card style={{padding:"24px"}}>
            <div style={{fontFamily:FD,fontSize:20,fontWeight:700,marginBottom:18}}>Nuevo hogar</div>
            <div style={{display:"grid",gap:14}}>
              <Field label="Nombre del hogar" value={houseName} onChange={e=>setHouseName(e.target.value)} placeholder="Casa García, Nuestro hogar..."/>
              {error && <div style={{background:C.red+"12",border:`1px solid ${C.red}30`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.red,fontFamily:FB}}>{error}</div>}
              <Btn onClick={createHousehold} full color={C.commit} disabled={loading}>{loading?"Creando...":"Crear hogar"}</Btn>
              <Btn outline onClick={()=>{setMode("choose");setError("");}} full>Volver</Btn>
            </div>
          </Card>
        )}

        {mode==="join" && (
          <Card style={{padding:"24px"}}>
            <div style={{fontFamily:FD,fontSize:20,fontWeight:700,marginBottom:18}}>Unirme con código</div>
            <div style={{display:"grid",gap:14}}>
              <Field label="Código de invitación" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123"/>
              {error && <div style={{background:C.red+"12",border:`1px solid ${C.red}30`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.red,fontFamily:FB}}>{error}</div>}
              <Btn onClick={joinHousehold} full color={C.savings} disabled={loading}>{loading?"Buscando...":"Unirme"}</Btn>
              <Btn outline onClick={()=>{setMode("choose");setError("");}} full>Volver</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── AMORT SHEET ──────────────────────────────────────────────────────────────
function AmortSheet({ item, onClose }) {
  const m = item.monthly||0, q = item.quotas||0, p = item.paid||0, rem = q-p;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,margin:"0 auto",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:36,height:4,borderRadius:2,background:C.border}}/></div>
        <div style={{padding:"8px 24px 40px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontFamily:FD,fontSize:20,fontWeight:700}}>{item.name}</div>
            <button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer"}}><X size={18} color={C.muted}/></button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[["Mensual",fmt(m),C.commit],["Pagadas",`${p}/${q}`,C.ink],["Restante",fmt(m*rem),C.red]].map(([l,v,col],i)=>(
              <div key={i} style={{background:C.bg,borderRadius:12,padding:10,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:FB,marginBottom:2}}>{l}</div>
                <div style={{fontFamily:FD,fontSize:16,fontWeight:800,color:col}}>{v}</div>
              </div>
            ))}
          </div>
          <Bar value={p} max={q||1} color={C.commit} h={8}/>
          <div style={{fontSize:11,color:C.muted,fontFamily:FB,marginTop:6,marginBottom:18}}>{p} de {q} cuotas completadas</div>
          {Array.from({length:q},(_,i)=>{
            const paid = i < p;
            return (
              <div key={i} style={{display:"grid",gridTemplateColumns:"36px 1fr 80px 50px",gap:8,padding:"10px 0",borderBottom:`1px solid ${C.border}`,opacity:paid?0.6:1}}>
                <span style={{fontSize:12,fontFamily:FM,color:C.muted}}>{i+1}</span>
                <span><Pill color={paid?C.savings:C.commit} small>{paid?"Pagada":"Pendiente"}</Pill></span>
                <span style={{textAlign:"right",fontSize:13,fontFamily:FM,fontWeight:600}}>{fmt(m)}</span>
                <span style={{textAlign:"center",fontSize:15}}>{paid?"✅":"○"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── COMMIT FORM ──────────────────────────────────────────────────────────────
function CommitForm({ onSave, onClose, editing }) {
  const [name,setName]=useState(editing?.name||"");
  const [type,setType]=useState(editing?.type||"subscription");
  const [monthly,setMonthly]=useState(editing?.monthly||"");
  const [quotas,setQuotas]=useState(editing?.quotas||"");
  const [paid,setPaid]=useState(editing?.paid||"0");
  const [notes,setNotes]=useState(editing?.notes||"");
  const isD = type==="deferred"||type==="loan";

  function submit() {
    if (!name||!monthly) return;
    onSave({ id:editing?.id||Date.now(),name,type,monthly:parseFloat(monthly)||0,quotas:isD?parseInt(quotas)||0:null,paid:isD?parseInt(paid)||0:null,notes,payments:editing?.payments||[],date:editing?.date||todayStr(),active:true });
    onClose();
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,margin:"0 auto",paddingBottom:40}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:36,height:4,borderRadius:2,background:C.border}}/></div>
        <div style={{padding:"8px 24px 0"}}>
          <div style={{fontFamily:FD,fontSize:20,fontWeight:700,marginBottom:18}}>{editing?"Editar compromiso":"Nuevo compromiso"}</div>
          <div style={{display:"grid",gap:12}}>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <label style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,fontFamily:FB}}>Tipo</label>
              <select value={type} onChange={e=>setType(e.target.value)} style={{...SI,padding:"10px 12px"}}>
                <option value="subscription">🔄 Suscripción</option>
                <option value="deferred">💳 Diferido (cuotas)</option>
                <option value="loan">🏦 Préstamo</option>
              </select>
            </div>
            <Field label="Nombre" value={name} onChange={e=>setName(e.target.value)} placeholder="Netflix, Laptop a meses..."/>
            <Field label="Pago mensual" type="number" prefix="$" value={monthly} onChange={e=>setMonthly(e.target.value)} placeholder="0"/>
            {isD && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Field label="Cuotas totales" type="number" value={quotas} onChange={e=>setQuotas(e.target.value)} placeholder="12"/>
                <Field label="Cuotas pagadas" type="number" value={paid} onChange={e=>setPaid(e.target.value)} placeholder="0"/>
              </div>
            )}
            <Field label="Notas (opcional)" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Tarjeta BBVA..."/>
            <Btn onClick={submit} full color={C.commit}>{editing?"Guardar":"Agregar compromiso"}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HISTORY SHEET ────────────────────────────────────────────────────────────
function HistSheet({ history, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,margin:"0 auto",maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:36,height:4,borderRadius:2,background:C.border}}/></div>
        <div style={{padding:"8px 24px 40px"}}>
          <div style={{fontFamily:FD,fontSize:22,fontWeight:700,marginBottom:18}}>Historial</div>
          {history.length===0 && <div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"40px 0",fontFamily:FB}}>Aún no hay meses cerrados</div>}
          {[...history].reverse().map((m,i) => {
            const inc = (+m.salary||0);
            const ar = RULES[m.rule]||RULES["50/30/20"];
            const saved = inc*(ar.savings||20)/100;
            return (
              <Card key={i} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:FD,fontSize:16,fontWeight:700}}>{MONTHS[(m.month||1)-1]} {m.year}</div>
                  <Pill color={C.savings}>{fmt(saved)} ahorrado</Pill>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{background:C.bg,borderRadius:10,padding:"8px 12px"}}>
                    <div style={{fontSize:10,color:C.muted,fontFamily:FB}}>Ingreso</div>
                    <div style={{fontFamily:FM,fontSize:15,fontWeight:700,color:C.needs}}>{fmt(inc)}</div>
                  </div>
                  <div style={{background:C.bg,borderRadius:10,padding:"8px 12px"}}>
                    <div style={{fontSize:10,color:C.muted,fontFamily:FB}}>Compromisos</div>
                    <div style={{fontFamily:FM,fontSize:15,fontWeight:700,color:C.commit}}>{fmt((m.commitments||[]).reduce((s,c)=>s+(+c.monthly||0),0))}</div>
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

// ─── EMERGENCY MODAL ──────────────────────────────────────────────────────────
function EmerModal({ available, onWithdraw, onClose }) {
  const msgs = ["¿Tu 'emergencia' es otra suscripción?","Cada peso retirado es tu yo futuro llorando.","¿Es esto realmente una emergencia?"];
  const [msg] = useState(msgs[Math.floor(Math.random()*msgs.length)]);
  const [confirmed,setConfirmed]=useState(false);
  const [just,setJust]=useState("");
  const [amt,setAmt]=useState("");
  const ok = confirmed && just.length>10 && parseFloat(amt)>0;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <Card style={{maxWidth:360,width:"100%",padding:28}}>
        <div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:C.red,marginBottom:12}}>⚠ Retiro de emergencia</div>
        <div style={{background:C.red+"12",border:`1px solid ${C.red}30`,borderRadius:12,padding:"12px 14px",fontFamily:FB,fontSize:13,fontStyle:"italic",marginBottom:14}}>"{msg}"</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:12,fontFamily:FB}}>Disponible: <strong style={{color:C.ink}}>{fmt(available)}</strong></div>
        <Field label="Monto" type="number" prefix="$" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="0" style={{marginBottom:10}}/>
        <Field label="Justificación" value={just} onChange={e=>setJust(e.target.value)} placeholder="¿Por qué es emergencia real?" style={{marginBottom:14}}/>
        <label style={{display:"flex",alignItems:"flex-start",gap:10,fontSize:12,fontFamily:FB,color:C.muted,cursor:"pointer",marginBottom:18}}>
          <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} style={{width:16,height:16,marginTop:1,flexShrink:0}}/>
          Acepto que probablemente no es una emergencia real
        </label>
        <div style={{display:"flex",gap:10}}>
          <Btn outline onClick={onClose} full>Cancelar</Btn>
          <Btn onClick={()=>{if(ok){onWithdraw(parseFloat(amt));onClose();}}} full color={C.red} disabled={!ok}>Retirar</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── PAY HISTORY WIDGET ───────────────────────────────────────────────────────
function PayHistory({ payments, profiles, color, onMark, labelPaid, labelMark }) {
  const alreadyPaid = (payments||[]).some(p => p.date===todayStr());
  return (
    <div>
      {(payments||[]).length > 0 && (
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:C.muted,fontFamily:FB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Historial de pagos</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {[...(payments||[])].reverse().map((p,i) => {
              const profile = profiles?.[p.user_id];
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:5,background:color+"10",border:`1px solid ${color}20`,borderRadius:8,padding:"3px 9px 3px 5px"}}>
                  {profile && <Avatar emoji={profile.avatar} name={profile.name} size={16}/>}
                  <span style={{fontSize:11,fontFamily:FM,color}}>{p.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <button onClick={onMark} style={{border:`1.5px solid ${color}`,borderRadius:10,background:alreadyPaid?color+"20":"transparent",color,fontFamily:FB,fontSize:12,fontWeight:600,padding:"7px 14px",cursor:"pointer"}}>
          {alreadyPaid ? labelPaid : labelMark}
        </button>
      </div>
    </div>
  );
}

// ═══════════════ HOME SCREEN ══════════════════════════════════════════════════
function HomeScreen({ derived, members, onHistory, onEmergency }) {
  const { baseInc,balanceCarryover,needsSpent,wantsSpent,savingsExtra,needsBudget,wantsBudget,savingsBudget,totalBalance,monthSavings,totalSavings,commitmentTotal,commitmentPct,isNeg,activeRule,currentMonth,currentYear } = derived;
  const totalSpent = needsSpent + wantsSpent;
  const spentPct = baseInc>0 ? clamp(Math.round(totalSpent/baseInc*100),0,100) : 0;
  const segs = [{v:needsSpent,c:C.needs},{v:wantsSpent,c:C.wants},{v:savingsBudget+savingsExtra,c:C.savings}];
  const rows = [
    {label:"Necesidades",spent:needsSpent,budget:needsBudget,color:C.needs},
    {label:"Deseos",spent:wantsSpent,budget:wantsBudget,color:C.wants},
    {label:"Ahorros",spent:savingsBudget+savingsExtra,budget:savingsBudget,color:C.savings},
  ];

  return (
    <div style={{padding:"0 16px 100px"}}>
      <div style={{padding:"20px 0 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:12,color:C.muted,fontFamily:FB}}>{new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})}</div>
          <div style={{fontFamily:FD,fontSize:24,fontWeight:800,color:C.ink,lineHeight:1.1}}>{MONTHS[currentMonth-1]} {currentYear}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {/* Members avatars */}
          <div style={{display:"flex"}}>
            {Object.values(members||{}).slice(0,3).map((m,i)=>(
              <div key={m.user_id} style={{marginLeft:i>0?-8:0,zIndex:3-i}}>
                <Avatar emoji={m.avatar} name={m.name} size={28}/>
              </div>
            ))}
          </div>
          <button onClick={onHistory} style={{border:`1.5px solid ${C.border}`,borderRadius:12,background:C.surface,padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontFamily:FB,color:C.muted}}>
            <Archive size={14}/> Historial
          </button>
        </div>
      </div>

      <Card style={{background:isNeg?C.red:C.ink,marginBottom:14,padding:"22px 24px 18px"}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",letterSpacing:1,textTransform:"uppercase",fontFamily:FB,marginBottom:4}}>Balance libre</div>
        <div style={{fontFamily:FD,fontSize:42,fontWeight:800,color:"#fff",lineHeight:1,marginBottom:4}}>{fmt(totalBalance)}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",fontFamily:FB,marginBottom:16}}>
          {fmt(baseInc)} ingreso{balanceCarryover>0?` + ${fmt(balanceCarryover)} del mes anterior`:""}
        </div>
        <div style={{display:"flex",borderTop:"1px solid rgba(255,255,255,0.12)",paddingTop:14}}>
          {[["Necesidades",fmt(needsBudget),`${activeRule.needs}%`],["Deseos",fmt(wantsBudget),`${activeRule.wants}%`],["Ahorros",fmt(savingsBudget),`${activeRule.savings}%`]].map(([l,v,s],i)=>(
            <div key={i} style={{flex:1,textAlign:"center",borderRight:i<2?"1px solid rgba(255,255,255,0.12)":"none"}}>
              <div style={{fontFamily:FD,fontSize:17,fontWeight:800,color:"#fff"}}>{v}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",fontFamily:FB}}>{s}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",fontFamily:FB,textTransform:"uppercase",letterSpacing:0.5,marginTop:1}}>{l}</div>
            </div>
          ))}
        </div>
      </Card>

      {baseInc>0 && (
        <Card style={{marginBottom:14,padding:18}}>
          <div style={{fontSize:13,fontWeight:700,color:C.ink,fontFamily:FB,marginBottom:14}}>Distribución del mes</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{position:"relative",flexShrink:0,width:150,height:150}}>
              <Donut segs={segs} size={150}/>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontFamily:FM,fontSize:20,fontWeight:800,color:C.ink}}>{spentPct}%</div>
                <div style={{fontSize:9,color:C.muted,fontFamily:FB}}>gastado</div>
              </div>
            </div>
            <div style={{flex:1,display:"grid",gap:9}}>
              {rows.map((row,i)=>{
                const left = row.budget-row.spent, over = left<0;
                return (
                  <div key={i}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:8,height:8,borderRadius:2,background:row.color,flexShrink:0}}/>
                        <span style={{fontSize:11,color:C.muted,fontFamily:FB}}>{row.label}</span>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <span style={{fontSize:11,fontFamily:FM,fontWeight:600,color:C.ink}}>{fmt(row.spent)}</span>
                        {row.budget>0&&<span style={{fontSize:10,fontFamily:FM,color:over?C.red:C.savings,marginLeft:5}}>{over?"-"+fmt(Math.abs(left)):"+"+fmt(left)}</span>}
                      </div>
                    </div>
                    <Bar value={row.spent} max={row.budget||1} color={row.color} h={5}/>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <Card style={{background:C.savings+"12",border:`1px solid ${C.savings}25`}}>
          <div style={{fontSize:10,color:C.savings,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",fontFamily:FB,marginBottom:4}}>Ahorros totales</div>
          <div style={{fontFamily:FD,fontSize:22,fontWeight:800,color:C.savings}}>{fmt(totalSavings)}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:2,fontFamily:FB}}>este mes: {fmt(monthSavings)}</div>
        </Card>
        <Card style={{background:C.commit+"12",border:`1px solid ${C.commit}25`}}>
          <div style={{fontSize:10,color:C.commit,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",fontFamily:FB,marginBottom:4}}>Compromisos</div>
          <div style={{fontFamily:FD,fontSize:22,fontWeight:800,color:C.commit}}>{fmt(commitmentTotal)}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:2,fontFamily:FB}}>{commitmentPct}% del ingreso</div>
        </Card>
      </div>

      <button onClick={onEmergency} style={{width:"100%",border:`2px solid ${C.red}`,borderRadius:16,background:"transparent",color:C.red,fontFamily:FB,fontWeight:700,fontSize:14,padding:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <Zap size={16}/> Retiro de emergencia · {fmt(totalSavings)} disponibles
      </button>
    </div>
  );
}

// ═══════════════ GASTOS SCREEN ════════════════════════════════════════════════
function GastosScreen({ data, derived, actions, members, myProfile }) {
  const { needsSpent,wantsSpent,needsBudget,wantsBudget,savingsBudget,savingsExtra,activeRule,commitmentTotal } = derived;
  const { recurring, transactions } = data;
  const [tab,setTab]=useState("recurrentes");
  const [showRF,setShowRF]=useState(false);
  const [showQ,setShowQ]=useState(false);
  const [nRec,setNRec]=useState({icon:"📋",label:"",amount:""});
  const [editRId,setEditRId]=useState(null);
  const [editR,setEditR]=useState({});
  const [nTx,setNTx]=useState({name:"",amount:""});
  const [nSav,setNSav]=useState({name:"",amount:""});
  const [editTId,setEditTId]=useState(null);
  const [editT,setEditT]=useState({});
  const wantsOnly = wantsSpent - commitmentTotal;

  return (
    <div style={{padding:"0 16px 100px"}}>
      <div style={{padding:"20px 0 14px"}}>
        <div style={{fontFamily:FD,fontSize:24,fontWeight:800,color:C.ink}}>Gastos del mes</div>
        <div style={{fontSize:12,color:C.muted,fontFamily:FB}}>Necesidades · Deseos · Ahorros</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        {[{label:"Necesidades",spent:needsSpent,budget:needsBudget,color:C.needs},{label:"Deseos",spent:wantsOnly,budget:Math.max(0,wantsBudget-commitmentTotal),color:C.wants}].map((item,i)=>{
          const left=item.budget-item.spent, over=left<0;
          return (
            <Card key={i}>
              <div style={{fontSize:10,color:item.color,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",fontFamily:FB,marginBottom:4}}>{item.label}</div>
              <div style={{fontFamily:FM,fontSize:16,fontWeight:800,color:over?C.red:C.ink,marginBottom:5}}>{over?"-"+fmt(Math.abs(left)):fmt(left)}<span style={{fontSize:11,fontWeight:400,color:C.muted}}> restante</span></div>
              <Bar value={item.spent} max={item.budget||1} color={item.color}/>
              <div style={{fontSize:10,color:C.muted,marginTop:4,fontFamily:FB}}>{fmt(item.spent)} / {fmt(item.budget)}</div>
            </Card>
          );
        })}
      </div>

      <div style={{display:"flex",gap:4,marginBottom:14,background:C.card,borderRadius:14,padding:4}}>
        {[{id:"recurrentes",label:"Recurrentes"},{id:"puntuales",label:"Puntuales"},{id:"ahorros",label:"Ahorros"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,border:"none",borderRadius:10,fontFamily:FB,fontSize:12,fontWeight:600,padding:"9px 0",cursor:"pointer",background:tab===t.id?C.surface:"transparent",color:tab===t.id?C.ink:C.muted,boxShadow:tab===t.id?"0 1px 4px rgba(0,0,0,0.08)":"none"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* RECURRENTES */}
      {tab==="recurrentes" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:600,color:C.ink,fontFamily:FB}}>Gastos fijos</div>
            <div style={{display:"flex",gap:8}}>
              <Btn small outline onClick={()=>{setShowQ(p=>!p);setShowRF(false);}}>Plantillas</Btn>
              <Btn small onClick={()=>{setShowRF(p=>!p);setShowQ(false);}}>+ Nuevo</Btn>
            </div>
          </div>
          {showQ && (
            <Card style={{marginBottom:12,padding:14}}>
              <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",fontFamily:FB,marginBottom:10}}>Toca para agregar</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {QUICK.filter(t=>!recurring.find(r=>r.label===t.label)).map(tpl=>(
                  <button key={tpl.label} onClick={()=>{actions.addFromTpl(tpl);setShowQ(false);}} style={{border:`1.5px solid ${C.needs}30`,borderRadius:20,background:C.needs+"08",color:C.needs,fontFamily:FB,fontSize:12,fontWeight:600,padding:"7px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>{tpl.icon} {tpl.label}</button>
                ))}
              </div>
            </Card>
          )}
          {showRF && (
            <Card style={{marginBottom:12,padding:14}}>
              <div style={{display:"grid",gridTemplateColumns:"40px 1fr 90px 32px",gap:8,alignItems:"center"}}>
                <input value={nRec.icon} onChange={e=>setNRec(p=>({...p,icon:e.target.value}))} style={{...SI,width:40,textAlign:"center",fontSize:18,padding:"6px 4px"}}/>
                <input placeholder="Nombre" value={nRec.label} onChange={e=>setNRec(p=>({...p,label:e.target.value}))} style={SI}/>
                <input type="number" placeholder="$" value={nRec.amount} onChange={e=>setNRec(p=>({...p,amount:e.target.value}))} style={{...SI,width:90,textAlign:"right"}}/>
                <button onClick={()=>{actions.addRec(nRec);setNRec({icon:"📋",label:"",amount:""});setShowRF(false);}} style={{border:"none",background:C.savings,borderRadius:8,width:32,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Check size={14} color="white"/></button>
              </div>
            </Card>
          )}
          {recurring.map(r=>(
            <Card key={r.id} style={{marginBottom:10,padding:"14px 16px"}}>
              {editRId===r.id ? (
                <div style={{display:"grid",gridTemplateColumns:"40px 1fr 90px 32px",gap:8,alignItems:"center"}}>
                  <input value={editR.icon} onChange={e=>setEditR(p=>({...p,icon:e.target.value}))} style={{...SI,width:40,textAlign:"center",fontSize:18,padding:"6px 4px"}}/>
                  <input value={editR.label} onChange={e=>setEditR(p=>({...p,label:e.target.value}))} style={SI}/>
                  <input type="number" value={editR.amount} onChange={e=>setEditR(p=>({...p,amount:e.target.value}))} style={{...SI,width:90,textAlign:"right"}}/>
                  <button onClick={()=>{actions.saveRec(r.id,editR);setEditRId(null);}} style={{border:"none",background:C.savings,borderRadius:8,width:32,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Check size={14} color="white"/></button>
                </div>
              ) : (
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20,opacity:r.active?1:0.4}}>{r.icon}</span>
                    <div style={{flex:1,opacity:r.active?1:0.5}}>
                      <div style={{fontSize:14,fontWeight:600,color:C.ink,fontFamily:FB}}>{r.label}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2,flexWrap:"wrap"}}>
                        <Pill color={C.needs} small>Necesidad</Pill>
                        {r.date&&<span style={{fontSize:10,color:C.muted,fontFamily:FB}}>Desde {r.date}</span>}
                        {r.user_id && members?.[r.user_id] && <AuthorTag profile={members[r.user_id]}/>}
                      </div>
                    </div>
                    <button onClick={()=>actions.toggleRec(r.id)} style={{border:`1.5px solid ${r.active?C.needs:C.border}`,borderRadius:8,background:r.active?C.needs+"15":"transparent",color:r.active?C.needs:C.muted,fontFamily:FB,fontSize:11,fontWeight:600,padding:"4px 10px",cursor:"pointer"}}>{r.active?"ON":"OFF"}</button>
                    <div style={{fontFamily:FM,fontSize:15,fontWeight:700,color:r.active?C.ink:C.muted,minWidth:54,textAlign:"right"}}>{+r.amount>0?fmt(r.amount):<span style={{color:C.border,fontSize:11}}>—</span>}</div>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>{setEditRId(r.id);setEditR({icon:r.icon,label:r.label,amount:r.amount});}} style={{border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:6,cursor:"pointer",display:"flex"}}><Pencil size={12} color={C.muted}/></button>
                      <button onClick={()=>actions.delRec(r.id)} style={{border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:6,cursor:"pointer",display:"flex"}}><Trash2 size={12} color={C.red}/></button>
                    </div>
                  </div>
                  <div style={{paddingTop:10,borderTop:`1px solid ${C.border}`,marginTop:10}}>
                    <PayHistory payments={r.payments} profiles={members} color={C.needs} onMark={()=>actions.markRecPaid(r.id)} labelPaid="✓ Pagado hoy" labelMark="Marcar como pagado"/>
                  </div>
                </div>
              )}
            </Card>
          ))}
          {recurring.length===0&&!showQ&&!showRF&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0",fontFamily:FB}}>Agrega tus gastos fijos: renta, luz, agua...</div>}
        </div>
      )}

      {/* PUNTUALES */}
      {tab==="puntuales" && (
        <div>
          <Card style={{marginBottom:12,padding:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 90px 36px",gap:8,marginBottom:8}}>
              <input placeholder="Pizza, taxis, ropa..." value={nTx.name} onChange={e=>setNTx(p=>({...p,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&actions.addTx(nTx,"auto",setNTx)} style={SI}/>
              <input type="number" placeholder="$" value={nTx.amount} onChange={e=>setNTx(p=>({...p,amount:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&actions.addTx(nTx,"auto",setNTx)} style={{...SI,width:90,textAlign:"right"}}/>
              <button onClick={()=>actions.addTx(nTx,"auto",setNTx)} style={{border:"none",background:C.ink,borderRadius:10,width:36,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Plus size={16} color="white"/></button>
            </div>
            {nTx.name&&<div style={{fontSize:11,color:C.muted,fontFamily:FB}}>Auto → <Pill color={autoCat(nTx.name)==="needs"?C.needs:C.wants} small>{autoCat(nTx.name)==="needs"?"Necesidad":"Deseo"}</Pill></div>}
          </Card>
          {transactions.filter(t=>t.category!=="savings").map(tx=>(
            <Card key={tx.id} style={{marginBottom:8,padding:"13px 16px"}}>
              {editTId===tx.id ? (
                <div style={{display:"grid",gridTemplateColumns:"1fr 90px 80px 32px",gap:8,alignItems:"center"}}>
                  <input value={editT.name} onChange={e=>setEditT(p=>({...p,name:e.target.value}))} style={SI}/>
                  <input type="number" value={editT.amount} onChange={e=>setEditT(p=>({...p,amount:e.target.value}))} style={{...SI,width:90,textAlign:"right"}}/>
                  <select value={editT.category} onChange={e=>setEditT(p=>({...p,category:e.target.value}))} style={{...SI,padding:"8px",width:80}}>
                    <option value="needs">Necesidad</option>
                    <option value="wants">Deseo</option>
                  </select>
                  <button onClick={()=>{actions.saveTx(tx.id,editT);setEditTId(null);}} style={{border:"none",background:C.savings,borderRadius:8,width:32,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Check size={14} color="white"/></button>
                </div>
              ) : (
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.ink,fontFamily:FB}}>{tx.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2,flexWrap:"wrap"}}>
                      <span style={{fontSize:10,color:C.muted,fontFamily:FB}}>{tx.date}</span>
                      <Pill color={tx.category==="needs"?C.needs:C.wants} small>{tx.category==="needs"?"Necesidad":"Deseo"}</Pill>
                      {tx.user_id && members?.[tx.user_id] && <AuthorTag profile={members[tx.user_id]}/>}
                    </div>
                  </div>
                  <div style={{fontFamily:FM,fontSize:16,fontWeight:700,color:C.ink}}>-{fmt(tx.amount)}</div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>{setEditTId(tx.id);setEditT({name:tx.name,amount:tx.amount,category:tx.category});}} style={{border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:6,cursor:"pointer",display:"flex"}}><Pencil size={12} color={C.muted}/></button>
                    <button onClick={()=>actions.delTx(tx.id)} style={{border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:6,cursor:"pointer",display:"flex"}}><Trash2 size={12} color={C.red}/></button>
                  </div>
                </div>
              )}
            </Card>
          ))}
          {transactions.filter(t=>t.category!=="savings").length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0",fontFamily:FB}}>Sin gastos puntuales este mes</div>}
        </div>
      )}

      {/* AHORROS */}
      {tab==="ahorros" && (
        <div>
          <Card style={{marginBottom:14,background:C.savings+"10",border:`1px solid ${C.savings}25`,padding:16}}>
            <div style={{fontSize:11,color:C.savings,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,fontFamily:FB,marginBottom:6}}>Ahorros automáticos</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:FB,lineHeight:1.6}}>Tu presupuesto reserva el <strong style={{color:C.savings}}>{activeRule.savings}%</strong> automáticamente. Aquí registras abonos extra.</div>
          </Card>
          <Card style={{marginBottom:12,padding:14}}>
            <div style={{fontSize:13,fontWeight:700,color:C.ink,fontFamily:FB,marginBottom:10}}>Abono extra</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 90px 36px",gap:8,marginBottom:6}}>
              <input placeholder="Descripción" value={nSav.name} onChange={e=>setNSav(p=>({...p,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&actions.addTx(nSav,"savings",setNSav)} style={SI}/>
              <input type="number" placeholder="$" value={nSav.amount} onChange={e=>setNSav(p=>({...p,amount:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&actions.addTx(nSav,"savings",setNSav)} style={{...SI,width:90,textAlign:"right"}}/>
              <button onClick={()=>actions.addTx(nSav,"savings",setNSav)} style={{border:"none",background:C.savings,borderRadius:10,width:36,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Plus size={16} color="white"/></button>
            </div>
          </Card>
          {transactions.filter(t=>t.category==="savings").map(tx=>(
            <Card key={tx.id} style={{marginBottom:8,padding:"13px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:C.ink,fontFamily:FB}}>{tx.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                    <span style={{fontSize:10,color:C.muted,fontFamily:FB}}>{tx.date}</span>
                    <Pill color={C.savings} small>Ahorro extra</Pill>
                    {tx.user_id && members?.[tx.user_id] && <AuthorTag profile={members[tx.user_id]}/>}
                  </div>
                </div>
                <div style={{fontFamily:FM,fontSize:16,fontWeight:700,color:C.savings}}>+{fmt(tx.amount)}</div>
                <button onClick={()=>actions.delTx(tx.id)} style={{border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:6,cursor:"pointer",display:"flex"}}><Trash2 size={12} color={C.red}/></button>
              </div>
            </Card>
          ))}
          {transactions.filter(t=>t.category==="savings").length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0",fontFamily:FB}}>Sin abonos extra este mes</div>}
        </div>
      )}
    </div>
  );
}

// ═══════════════ COMPROMISOS SCREEN ══════════════════════════════════════════
function CompromisosScreen({ data, derived, actions, members }) {
  const { commitments } = data;
  const { commitmentTotal, baseInc } = derived;
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [amortItem,setAmortItem]=useState(null);
  const groups = [{label:"Suscripciones",icon:"🔄",type:"subscription"},{label:"Diferidos",icon:"💳",type:"deferred"},{label:"Préstamos",icon:"🏦",type:"loan"}];

  return (
    <div style={{padding:"0 16px 100px"}}>
      {showForm&&<CommitForm editing={editing} onSave={c=>{actions.addCommitment(c);setEditing(null);}} onClose={()=>{setShowForm(false);setEditing(null);}}/>}
      {amortItem&&<AmortSheet item={amortItem} onClose={()=>setAmortItem(null)}/>}
      <div style={{padding:"20px 0 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:FD,fontSize:24,fontWeight:800,color:C.ink}}>Compromisos</div>
          <div style={{fontSize:12,color:C.muted,fontFamily:FB}}>Suscripciones · Diferidos · Préstamos</div>
        </div>
        <Btn onClick={()=>{setEditing(null);setShowForm(true);}} color={C.commit}>+ Nuevo</Btn>
      </div>
      <Card style={{background:C.commit+"10",border:`1px solid ${C.commit}20`,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontSize:10,color:C.commit,fontWeight:700,textTransform:"uppercase",fontFamily:FB,marginBottom:4}}>Impacto mensual total</div>
            <div style={{fontFamily:FD,fontSize:28,fontWeight:800,color:C.commit}}>{fmt(commitmentTotal)}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:FM,fontSize:24,fontWeight:800,color:C.commit}}>{baseInc>0?Math.round(commitmentTotal/baseInc*100):0}%</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:FB}}>del ingreso</div>
          </div>
        </div>
        {baseInc>0&&<Bar value={commitmentTotal} max={baseInc} color={C.commit} h={8}/>}
      </Card>
      {groups.map(g=>{
        const items=commitments.filter(c=>c.type===g.type);
        if(!items.length) return null;
        return (
          <div key={g.type} style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:16}}>{g.icon}</span>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:C.ink}}>{g.label}</div>
              <div style={{fontSize:12,color:C.commit,fontFamily:FM,fontWeight:600}}>{fmt(items.reduce((s,c)=>s+c.monthly,0))}/mes</div>
            </div>
            {items.map(c=>{
              const isD=c.type==="deferred"||c.type==="loan";
              const rem=isD?(c.quotas||0)-(c.paid||0):null;
              return (
                <Card key={c.id} style={{marginBottom:10,padding:"15px 17px"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                    <span style={{fontSize:22,flexShrink:0}}>{g.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                        <div style={{fontFamily:FB,fontSize:15,fontWeight:700,color:C.ink}}>{c.name}</div>
                        <div style={{fontFamily:FM,fontSize:15,fontWeight:800,color:C.commit}}>-{fmt(c.monthly)}/mes</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                        {c.date&&<span style={{fontSize:10,color:C.muted,fontFamily:FB}}>Desde {c.date}</span>}
                        {c.user_id && members?.[c.user_id] && <AuthorTag profile={members[c.user_id]}/>}
                      </div>
                      {isD&&c.quotas>0&&(
                        <div style={{marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                            <div style={{fontSize:11,color:C.muted,fontFamily:FB}}>{c.paid||0}/{c.quotas} cuotas · {fmt(c.monthly*(rem||0))} restante</div>
                            <button onClick={()=>setAmortItem(c)} style={{border:`1px solid ${C.commit}40`,borderRadius:8,background:C.commit+"10",color:C.commit,fontFamily:FB,fontSize:10,fontWeight:600,padding:"3px 9px",cursor:"pointer"}}>Ver tabla</button>
                          </div>
                          <Bar value={c.paid||0} max={c.quotas} color={C.commit}/>
                          <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                            <span style={{fontSize:10,color:C.muted,fontFamily:FB}}>Pagado: {fmt(c.monthly*(c.paid||0))}</span>
                            <span style={{fontSize:10,color:C.muted,fontFamily:FB}}>Total: {fmt(c.monthly*c.quotas)}</span>
                          </div>
                        </div>
                      )}
                      {c.notes&&<div style={{fontSize:11,color:C.muted,fontFamily:FB,marginBottom:8}}>{c.notes}</div>}
                      <div style={{paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                        <PayHistory payments={c.payments} profiles={members} color={C.commit} onMark={()=>actions.markCommitmentPaid(c.id)} labelPaid="✓ Cobrado hoy" labelMark="Marcar cobro"/>
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                    <button onClick={()=>{setEditing(c);setShowForm(true);}} style={{border:`1.5px solid ${C.border}`,borderRadius:10,background:"transparent",padding:"7px 14px",cursor:"pointer",fontFamily:FB,fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:5}}><Pencil size={12}/> Editar</button>
                    <button onClick={()=>actions.delCommitment(c.id)} style={{border:`1.5px solid ${C.red}25`,borderRadius:10,background:C.red+"08",padding:"7px 14px",cursor:"pointer",fontFamily:FB,fontSize:12,color:C.red,display:"flex",alignItems:"center",gap:5}}><Trash2 size={12}/> Eliminar</button>
                  </div>
                </Card>
              );
            })}
          </div>
        );
      })}
      {commitments.length===0&&(
        <div style={{textAlign:"center",padding:"48px 20px"}}>
          <div style={{fontSize:36,marginBottom:12}}>💳</div>
          <div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:C.ink,marginBottom:6}}>Sin compromisos</div>
          <Btn onClick={()=>setShowForm(true)} color={C.commit}>Agregar primer compromiso</Btn>
        </div>
      )}
    </div>
  );
}

// ═══════════════ CONFIG SCREEN ════════════════════════════════════════════════
function ConfigScreen({ data, actions, session, household, members, onSignOut }) {
  const { salary, extras, rule, custom } = data;
  const [nExtra,setNExtra]=useState({label:"",amount:""});
  const [editEId,setEditEId]=useState(null);
  const [editE,setEditE]=useState({});
  const [copied,setCopied]=useState(false);

  function copyCode() {
    if (navigator.clipboard) navigator.clipboard.writeText(household.invite_code);
    setCopied(true);
    setTimeout(()=>setCopied(false),2000);
  }

  return (
    <div style={{padding:"0 16px 100px"}}>
      <div style={{padding:"20px 0 14px"}}>
        <div style={{fontFamily:FD,fontSize:24,fontWeight:800,color:C.ink}}>Configuración</div>
        <div style={{fontSize:12,color:C.muted,fontFamily:FB}}>Ingresos · Hogar · Sesión</div>
      </div>

      {/* Household card */}
      <Card style={{marginBottom:14,background:C.commit+"08",border:`1.5px solid ${C.commit}20`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:10,color:C.commit,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,fontFamily:FB,marginBottom:3}}>🏠 Hogar</div>
            <div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:C.ink}}>{household.name}</div>
          </div>
          <div style={{display:"flex",gap:-8}}>
            {Object.values(members||{}).map((m,i)=>(
              <div key={m.user_id} style={{marginLeft:i>0?-8:0}}>
                <Avatar emoji={m.avatar} name={m.name} size={36}/>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{flex:1,background:C.bg,borderRadius:10,padding:"8px 12px",fontFamily:FM,fontSize:15,fontWeight:700,color:C.ink,letterSpacing:3}}>{household.invite_code}</div>
          <button onClick={copyCode} style={{border:`1.5px solid ${C.commit}`,borderRadius:10,background:copied?C.commit+"15":"transparent",color:C.commit,fontFamily:FB,fontSize:12,fontWeight:600,padding:"8px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <Copy size={13}/>{copied?"Copiado":"Copiar"}
          </button>
        </div>
        <div style={{fontSize:11,color:C.muted,fontFamily:FB,marginTop:8}}>Comparte este código para que tu pareja se una al hogar</div>
        <div style={{marginTop:12}}>
          {Object.values(members||{}).map(m=>(
            <div key={m.user_id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <Avatar emoji={m.avatar} name={m.name} size={28}/>
              <div style={{fontSize:13,fontWeight:600,color:C.ink,fontFamily:FB}}>{m.name}</div>
              <Pill color={m.role==="admin"?C.commit:C.muted} small>{m.role==="admin"?"Admin":"Miembro"}</Pill>
            </div>
          ))}
        </div>
      </Card>

      {/* Salary */}
      <Card style={{marginBottom:14,background:!parseFloat(salary)?C.yellow+"18":C.surface,border:!parseFloat(salary)?`1.5px solid ${C.yellow}`:undefined}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{fontFamily:FB,fontSize:14,fontWeight:700,color:C.ink}}>💰 Ingreso mensual total</div>
          {!parseFloat(salary)&&<Pill color={C.yellow}>Pendiente</Pill>}
        </div>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:20,fontFamily:FM,color:C.muted,pointerEvents:"none"}}>$</span>
          <input type="number" value={salary} onChange={e=>actions.setSalary(e.target.value)} placeholder="0" style={{...SI,borderRadius:14,fontFamily:FM,fontSize:28,fontWeight:800,padding:"12px 16px 12px 36px",border:`1.5px solid ${C.border}`}}/>
        </div>
        <div style={{fontSize:11,color:C.muted,fontFamily:FB,marginTop:8}}>Suma de todos los ingresos del hogar este mes</div>
      </Card>

      {/* Extras */}
      <Card style={{marginBottom:14}}>
        <div style={{fontFamily:FB,fontSize:14,fontWeight:700,color:C.ink,marginBottom:14}}>+ Ingresos extra</div>
        {extras.map(e=>(
          <div key={e.id} style={{marginBottom:8}}>
            {editEId===e.id ? (
              <div style={{display:"grid",gridTemplateColumns:"1fr 90px 32px",gap:8}}>
                <input value={editE.label} onChange={ev=>setEditE(p=>({...p,label:ev.target.value}))} style={SI}/>
                <input type="number" value={editE.amount} onChange={ev=>setEditE(p=>({...p,amount:ev.target.value}))} style={{...SI,width:90,textAlign:"right"}}/>
                <button onClick={()=>{actions.saveExtra(e.id,editE);setEditEId(null);}} style={{border:"none",background:C.savings,borderRadius:10,width:32,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Check size={14} color="white"/></button>
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:C.bg,borderRadius:12}}>
                <div style={{width:4,height:26,background:C.yellow,borderRadius:2,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:C.muted,fontFamily:FB}}>{e.label}</div>
                  <div style={{fontFamily:FM,fontSize:15,fontWeight:700,color:C.ink}}>{fmt(e.amount)}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                    {e.date&&<span style={{fontSize:10,color:C.muted,fontFamily:FB}}>{e.date}</span>}
                    {e.user_id&&members?.[e.user_id]&&<AuthorTag profile={members[e.user_id]}/>}
                  </div>
                </div>
                <button onClick={()=>{setEditEId(e.id);setEditE({label:e.label,amount:e.amount});}} style={{border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:6,cursor:"pointer",display:"flex"}}><Pencil size={12} color={C.muted}/></button>
                <button onClick={()=>actions.delExtra(e.id)} style={{border:`1.5px solid ${C.border}`,borderRadius:8,background:"transparent",padding:6,cursor:"pointer",display:"flex"}}><Trash2 size={12} color={C.red}/></button>
              </div>
            )}
          </div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 90px 36px",gap:8,marginTop:8}}>
          <input placeholder="Freelance, bono..." value={nExtra.label} onChange={e=>setNExtra(p=>({...p,label:e.target.value}))} style={SI}/>
          <input type="number" placeholder="$" value={nExtra.amount} onChange={e=>setNExtra(p=>({...p,amount:e.target.value}))} style={{...SI,width:90,textAlign:"right"}}/>
          <button onClick={()=>{actions.addExtra(nExtra);setNExtra({label:"",amount:""});}} style={{border:"none",background:C.ink,borderRadius:10,width:36,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Plus size={16} color="white"/></button>
        </div>
      </Card>

      {/* Rule */}
      <Card style={{marginBottom:14}}>
        <div style={{fontFamily:FB,fontSize:14,fontWeight:700,color:C.ink,marginBottom:14}}>Regla presupuestal</div>
        <div style={{display:"grid",gap:8}}>
          {Object.keys(RULES).map((r,i)=>{
            const cols=[C.needs,C.wants,C.savings];
            return (
              <button key={r} onClick={()=>actions.setRule(r)} style={{border:`1.5px solid ${rule===r?cols[i]:C.border}`,borderRadius:12,background:rule===r?cols[i]+"12":"transparent",padding:"12px 16px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:FB,fontSize:14,color:rule===r?cols[i]:C.ink,fontWeight:rule===r?700:500}}>
                <span>{r}</span>{rule===r&&<Check size={16}/>}
              </button>
            );
          })}
        </div>
        {rule==="Personalizado"&&(
          <div style={{marginTop:14,display:"grid",gap:10}}>
            {[["needs","Necesidades",C.needs],["wants","Deseos",C.wants],["savings","Ahorros",C.savings]].map(([k,label,col])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:10,height:10,borderRadius:2,background:col,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <label style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,fontFamily:FB,display:"block",marginBottom:4}}>{label} %</label>
                  <input type="number" value={custom[k]} onChange={e=>actions.setCustom(p=>({...p,[k]:+e.target.value}))} style={{...SI,borderColor:col}}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sign out */}
      <button onClick={onSignOut} style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:14,background:"transparent",color:C.muted,fontFamily:FB,fontWeight:600,fontSize:14,padding:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <LogOut size={16}/> Cerrar sesión
      </button>
    </div>
  );
}

// ═══════════════ ROOT ═════════════════════════════════════════════════════════
export default function Sincopa() {
  const [screen,       setScreen]       = useState("loading");  // loading|auth|household|app
  const [session,      setSession]      = useState(null);
  const [household,    setHousehold]    = useState(null);
  const [members,      setMembers]      = useState({});         // { user_id: profile }
  const [myProfile,    setMyProfile]    = useState(null);
  const [tab,          setTab]          = useState("home");
  const [syncing,      setSyncing]      = useState(false);

  // App state (synced to Supabase)
  const now = new Date();
  const [currentYear,       setCurrentYear]       = useState(now.getFullYear());
  const [currentMonth,      setCurrentMonth]       = useState(now.getMonth()+1);
  const [salary,            setSalary]            = useState("");
  const [extras,            setExtras]            = useState([]);
  const [rule,              setRule]              = useState("50/30/20");
  const [custom,            setCustom]            = useState({needs:50,wants:30,savings:20});
  const [recurring,         setRecurring]         = useState([]);
  const [transactions,      setTransactions]      = useState([]);
  const [commitments,       setCommitments]       = useState([]);
  const [history,           setHistory]           = useState([]);
  const [totalSavingsAccum, setTotalSavingsAccum] = useState(0);
  const [withdrawn,         setWithdrawn]         = useState(0);
  const [balanceCarryover,  setBalanceCarryover]  = useState(0);
  const [showHistory,       setShowHistory]       = useState(false);
  const [showEmergency,     setShowEmergency]     = useState(false);

  const saveTimeout = useRef(null);

  // ── INIT: restore session or grab token from URL (after email confirm) ──
  useEffect(() => {
    // Official Supabase SDK handles session persistence and URL tokens automatically
    SB.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setScreen("auth"); return; }
      const s = { token: session.access_token, user: session.user };
      saveSession(s);
      setSession(s);
      setScreen("loadingHousehold");
      loadHousehold(s);
    });

    // Listen for auth state changes (handles email confirmation redirect)
    const { data: { subscription } } = SB.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const s = { token: session.access_token, user: session.user };
        saveSession(s);
        setSession(s);
        setScreen("loadingHousehold");
        loadHousehold(s);
      }
      if (event === "SIGNED_OUT") {
        clearSession();
        setScreen("auth");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadHousehold(s) {
    try {
      const { data: memberships } = await SB.from("household_members").select("*").eq("user_id", s.user.id);
      if (!memberships || memberships.length === 0) { setScreen("household"); return; }
      const hid = memberships[0].household_id;
      const { data: households } = await SB.from("households").select("*").eq("id", hid);
      if (!households || households.length === 0) { setScreen("household"); return; }
      const hh = households[0];
      setHousehold(hh);
      await loadAllMembers(hid, s);
      await loadAppState(hh, s);
      setScreen("app");
    } catch(err) {
      console.error("loadHousehold error:", err);
      setScreen("household");
    }
  }

  async function loadAllMembers(hid, s) {
    const { data } = await SB.from("household_members").select("*").eq("household_id", hid);
    if (data) {
      const map = {};
      data.forEach(m => { map[m.user_id] = m; });
      setMembers(map);
      if (s?.user?.id) setMyProfile(map[s.user.id]);
    }
  }

  async function loadAppState(hh, s) {
    // Load all data from Supabase tables for this household
    const hid = hh.id;
    
    const [recR, txR, commitR, extrasR, histR, stateR] = await Promise.all([
      SB.from("recurring").select("*").eq("household_id", hid),
      SB.from("transactions").select("*").eq("household_id", hid),
      SB.from("commitments").select("*").eq("household_id", hid),
      SB.from("extras").select("*").eq("household_id", hid),
      SB.from("history").select("*").eq("household_id", hid),
      SB.from("household_state").select("*").eq("household_id", hid),
    ]);

    if (recR.data)    setRecurring(recR.data);
    if (txR.data)     setTransactions(txR.data);
    if (commitR.data) setCommitments(commitR.data);
    if (extrasR.data) setExtras(extrasR.data);
    if (histR.data)   setHistory(histR.data);

    const st = stateR.data?.[0];
    if (st) {
      setSalary(st.salary?.toString() || "");
      setRule(st.rule || "50/30/20");
      setCustom({ needs: st.custom_needs||50, wants: st.custom_wants||30, savings: st.custom_savings||20 });
      setCurrentYear(st.current_year || now.getFullYear());
      setCurrentMonth(st.current_month || now.getMonth()+1);
      setTotalSavingsAccum(st.total_savings_accum || 0);
      setWithdrawn(st.withdrawn || 0);
      setBalanceCarryover(st.balance_carryover || 0);
    }

    // Auto-rollover check
    const savedYear  = st?.current_year  || now.getFullYear();
    const savedMonth = st?.current_month || now.getMonth()+1;
    const elapsed    = (now.getFullYear()-savedYear)*12 + (now.getMonth()+1-savedMonth);
    if (elapsed > 0 && st) {
      await doRollover(hh, s, st, recR.data||[], txR.data||[], commitR.data||[], extrasR.data||[], elapsed);
    }
  }

  async function doRollover(hh, s, st, recs, txs, commits, exts, elapsed) {
    const ar = RULES[st.rule] || RULES["50/30/20"];
    const prevInc = (+st.salary||0) + exts.reduce((sum,e)=>sum+(+e.amount||0),0);
    const prevCommit = commits.reduce((sum,c)=>sum+(+c.monthly||0),0);
    const prevRecN = recs.filter(r=>r.active&&+r.amount>0).reduce((sum,r)=>sum+(+r.amount),0);
    const prevTxN = txs.filter(t=>t.category==="needs").reduce((sum,t)=>sum+t.amount,0);
    const prevTxW = txs.filter(t=>t.category==="wants").reduce((sum,t)=>sum+t.amount,0);
    const prevTxS = txs.filter(t=>t.category==="savings").reduce((sum,t)=>sum+t.amount,0);
    const prevBal = prevInc-(prevRecN+prevTxN)-(prevTxW+prevCommit)-prevInc*(ar.savings||20)/100-prevTxS;
    const newAccum = (+st.total_savings_accum||0) + Math.max(0, prevInc*(ar.savings||20)/100+prevTxS);
    const newCarry = Math.max(0, prevBal);

    // Archive old month
    await SB.from("history").insert({
      household_id: hh.id, year: st.current_year, month: st.current_month,
      salary: st.salary, rule: st.rule,
    });

    // Advance deferred quotas
    for (const c of commits) {
      if ((c.type==="deferred"||c.type==="loan") && c.quotas!=null) {
        const newPaid = Math.min((c.paid||0)+elapsed, c.quotas);
        if (newPaid >= c.quotas) {
          await SB.from("commitments").delete().eq("id", c.id);
        } else {
          await SB.from("commitments").update({ paid: newPaid }).eq("id", c.id);
        }
      }
    }

    // Clear transactions, update state
    await SB.from("transactions").delete().eq("household_id", hh.id);
    await SB.from("household_state").update({
      current_year: now.getFullYear(),
      current_month: now.getMonth()+1,
      total_savings_accum: newAccum,
      withdrawn: 0,
      balance_carryover: newCarry,
    }).eq("household_id", hh.id);

    setTransactions([]);
    setTotalSavingsAccum(newAccum);
    setWithdrawn(0);
    setBalanceCarryover(newCarry);
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth()+1);

    // Reload everything
    await loadAppState(hh, s);
  }

  // ── POLL for changes every 6 seconds ──
  useEffect(() => {
    if (screen !== "app" || !household || !session) return;
    const interval = setInterval(async () => {
      await loadAllMembers(household.id, session);
      const [recR, txR, commitR, extrasR] = await Promise.all([
        SB.from("recurring").select("*").eq("household_id", household.id),
        SB.from("transactions").select("*").eq("household_id", household.id),
        SB.from("commitments").select("*").eq("household_id", household.id),
        SB.from("extras").select("*").eq("household_id", household.id),
      ]);
      if (recR.data)    setRecurring(recR.data);
      if (txR.data)     setTransactions(txR.data);
      if (commitR.data) setCommitments(commitR.data);
      if (extrasR.data) setExtras(extrasR.data);
    }, 6000);
    return () => clearInterval(interval);
  }, [screen, household, session]);

  // ── SAVE state to Supabase ──
  async function saveState(overrides = {}) {
    if (!household || !session) return;
    const st = {
      household_id: household.id,
      salary: parseFloat(salary)||0,
      rule, custom_needs: custom.needs, custom_wants: custom.wants, custom_savings: custom.savings,
      current_year: currentYear, current_month: currentMonth,
      total_savings_accum: totalSavingsAccum, withdrawn, balance_carryover: balanceCarryover,
      ...overrides,
    };
    await SB.from("household_state").upsert(st, { onConflict: "household_id" });
  }

  // ── AUTH ──
  function handleAuth(s) {
    setSession(s);
    setScreen("loadingHousehold");
    loadHousehold(s);
  }

  function handleHousehold(hh) {
    setHousehold(hh);
    loadAllMembers(hh.id, session);
    loadAppState(hh, session);
    setScreen("app");
  }

  async function handleSignOut() {
    await SB.auth.signOut();
    clearSession();
    setSession(null);
    setHousehold(null);
    setMembers({});
    setScreen("auth");
  }

  // ── DERIVED ──
  const activeRule      = rule==="Personalizado" ? custom : RULES[rule];
  const baseInc         = (parseFloat(salary)||0) + extras.reduce((s,e)=>s+(+e.amount||0),0);
  const inc             = baseInc + balanceCarryover;
  const needsBudget     = baseInc * activeRule.needs   / 100;
  const wantsBudget     = baseInc * activeRule.wants   / 100;
  const savingsBudget   = baseInc * activeRule.savings / 100;
  const commitmentTotal = commitments.filter(c=>c.active!==false).reduce((s,c)=>s+(+c.monthly||0),0);
  const commitmentPct   = baseInc>0 ? Math.round(commitmentTotal/baseInc*100) : 0;
  const recNeeds        = recurring.filter(r=>r.active&&+r.amount>0).reduce((s,r)=>s+(+r.amount),0);
  const txNeeds         = transactions.filter(t=>t.category==="needs").reduce((s,t)=>s+t.amount,0);
  const txWants         = transactions.filter(t=>t.category==="wants").reduce((s,t)=>s+t.amount,0);
  const txSavings       = transactions.filter(t=>t.category==="savings").reduce((s,t)=>s+t.amount,0);
  const needsSpent      = recNeeds + txNeeds;
  const wantsSpent      = txWants + commitmentTotal;
  const savingsExtra    = txSavings;
  const monthSavings    = Math.max(0, savingsBudget + savingsExtra);
  const totalSavings    = totalSavingsAccum + monthSavings - withdrawn;
  const totalBalance    = inc - needsSpent - wantsSpent - savingsBudget - savingsExtra;
  const isNeg           = totalBalance < 0;

  const derived = { baseInc,balanceCarryover,inc,needsSpent,wantsSpent,savingsExtra,needsBudget,wantsBudget,savingsBudget,totalBalance,monthSavings,totalSavings,commitmentTotal,commitmentPct,isNeg,activeRule,currentMonth,currentYear };
  const data = { salary, extras, rule, custom, recurring, transactions, commitments, history };

  // ── ACTIONS ──
  const uid = () => session?.user?.id;
  const getToken = async () => { const { data } = await SB.auth.getSession(); return data.session?.access_token; };

  const actions = {
    setSalary: async v => { setSalary(v); await saveState({ salary: parseFloat(v)||0 }); },
    setRule:   async v => { setRule(v);   await saveState({ rule: v }); },
    setCustom: async fn => {
      const next = typeof fn==="function" ? fn(custom) : fn;
      setCustom(next);
      await saveState({ custom_needs:next.needs, custom_wants:next.wants, custom_savings:next.savings });
    },
    addExtra: async e => {
      if (!e.label||!e.amount) return;
      const row = { id: Date.now(), household_id: household.id, label: e.label, amount: +e.amount, date: todayStr(), user_id: uid() };
      setExtras(p=>[...p,row]);
      await SB.from("extras").insert(row);
    },
    delExtra: async id => {
      setExtras(p=>p.filter(e=>e.id!==id));
      await SB.from("extras").delete().eq("id", id);
    },
    saveExtra: async (id, ed) => {
      setExtras(p=>p.map(e=>e.id===id?{...e,...ed,amount:+ed.amount}:e));
      await SB.from("extras").update({ label:ed.label, amount:+ed.amount }).eq("id", id);
    },
    toggleRec: async id => {
      setRecurring(p=>p.map(r=>r.id===id?{...r,active:!r.active}:r));
      const r = recurring.find(x=>x.id===id);
      if (r) await SB.from("recurring").update({ active: !r.active }).eq("id", id);
    },
    delRec: async id => {
      setRecurring(p=>p.filter(r=>r.id!==id));
      await SB.from("recurring").delete().eq("id", id);
    },
    saveRec: async (id, ed) => {
      setRecurring(p=>p.map(r=>r.id===id?{...r,...ed,amount:+ed.amount}:r));
      await SB.from("recurring").update({ icon:ed.icon, label:ed.label, amount:+ed.amount }).eq("id", id);
    },
    addRec: async r => {
      if (!r.label) return;
      const row = { id: Date.now(), household_id: household.id, icon:r.icon||"📋", label:r.label, amount:+r.amount||0, category:"needs", active:true, date:todayStr(), payments:[], user_id:uid() };
      setRecurring(p=>[...p,row]);
      await SB.from("recurring").insert(row);
    },
    addFromTpl: async tpl => {
      const row = { id: Date.now(), household_id: household.id, icon:tpl.icon, label:tpl.label, amount:0, category:"needs", active:true, date:todayStr(), payments:[], user_id:uid() };
      setRecurring(p=>[...p,row]);
      await SB.from("recurring").insert(row);
    },
    markRecPaid: async id => {
      const t = todayStr();
      setRecurring(p=>p.map(r=>{
        if (r.id!==id) return r;
        const payments = r.payments||[];
        if (payments.some(p=>p.date===t)) return r;
        return {...r, payments:[...payments,{date:t,user_id:uid()}]};
      }));
      const r = recurring.find(x=>x.id===id);
      if (r) {
        const payments = [...(r.payments||[])];
        if (!payments.some(p=>p.date===t)) {
          payments.push({date:t,user_id:uid()});
          await SB.from("recurring").update({ payments }).eq("id", id);
        }
      }
    },
    addTx: async (tx, cat, reset) => {
      if (!tx.name||!tx.amount) return;
      const category = cat==="savings"?"savings":cat==="auto"?autoCat(tx.name):cat;
      const row = { id: Date.now(), household_id: household.id, name:tx.name, amount:+tx.amount, category, date:todayStr(), user_id:uid() };
      setTransactions(p=>[...p,row]);
      await SB.from("transactions").insert(row);
      reset({name:"",amount:""});
    },
    delTx: async id => {
      setTransactions(p=>p.filter(t=>t.id!==id));
      await SB.from("transactions").delete().eq("id", id);
    },
    saveTx: async (id, ed) => {
      setTransactions(p=>p.map(t=>t.id===id?{...t,...ed,amount:+ed.amount}:t));
      await SB.from("transactions").update({ name:ed.name, amount:+ed.amount, category:ed.category }).eq("id", id);
    },
    addCommitment: async c => {
      const row = { ...c, household_id: household.id, user_id: uid() };
      const ex = commitments.find(x=>x.id===c.id);
      if (ex) {
        setCommitments(p=>p.map(x=>x.id===c.id?row:x));
        await SB.from("commitments").update(row).eq("id", c.id);
      } else {
        setCommitments(p=>[...p,row]);
        await SB.from("commitments").insert(row);
      }
    },
    delCommitment: async id => {
      setCommitments(p=>p.filter(c=>c.id!==id));
      await SB.from("commitments").delete().eq("id", id);
    },
    markCommitmentPaid: async id => {
      const t = todayStr();
      setCommitments(p=>p.map(c=>{
        if (c.id!==id) return c;
        const payments = c.payments||[];
        if (payments.some(p=>p.date===t)) return c;
        return {...c, payments:[...payments,{date:t,user_id:uid()}]};
      }));
      const c = commitments.find(x=>x.id===id);
      if (c) {
        const payments = [...(c.payments||[])];
        if (!payments.some(p=>p.date===t)) {
          payments.push({date:t,user_id:uid()});
          await SB.from("commitments").update({ payments }).eq("id", id);
        }
      }
    },
    withdraw: async amt => {
      const nw = withdrawn + amt;
      setWithdrawn(nw);
      await saveState({ withdrawn: nw });
    },
  };

  // ── SCREENS ──
  if (screen==="loading"||screen==="loadingHousehold") {
    return (
      <div style={{background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
        <div style={{fontFamily:FD,fontSize:36,fontWeight:800,color:C.ink,letterSpacing:-1}}>Síncopa</div>
        <div style={{fontSize:13,color:C.muted,fontFamily:FB}}>
          {screen==="loadingHousehold" ? "Cargando tu hogar..." : "Cargando..."}
        </div>
        <RefreshCw size={20} color={C.muted} style={{animation:"spin 1s linear infinite"}}/>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  if (screen==="auth")      return <AuthScreen onAuth={handleAuth}/>;
  if (screen==="household") return <HouseholdScreen session={session} onHousehold={handleHousehold} onSignOut={handleSignOut}/>;

  const TABS = [
    {id:"home",        Icon:Home,     label:"Inicio"},
    {id:"gastos",      Icon:List,     label:"Gastos"},
    {id:"compromisos", Icon:Layers,   label:"Compromisos"},
    {id:"config",      Icon:Settings, label:"Config"},
  ];

  return (
    <div style={{background:C.bg,minHeight:"100vh",maxWidth:480,margin:"0 auto",position:"relative"}}>
      {showHistory   && <HistSheet   history={history}        onClose={()=>setShowHistory(false)}/>}
      {showEmergency && <EmerModal   available={totalSavings} onWithdraw={actions.withdraw} onClose={()=>setShowEmergency(false)}/>}

      <div style={{paddingBottom:80}}>
        {tab==="home"        && <HomeScreen        derived={derived} members={members} onHistory={()=>setShowHistory(true)} onEmergency={()=>setShowEmergency(true)}/>}
        {tab==="gastos"      && <GastosScreen      data={data} derived={derived} actions={actions} members={members} myProfile={myProfile}/>}
        {tab==="compromisos" && <CompromisosScreen data={data} derived={derived} actions={actions} members={members}/>}
        {tab==="config"      && <ConfigScreen      data={data} actions={actions} session={session} household={household} members={members} onSignOut={handleSignOut}/>}
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.surface,borderTop:`1px solid ${C.border}`,display:"grid",gridTemplateColumns:"repeat(4,1fr)",padding:"8px 0 16px",zIndex:100,boxShadow:"0 -4px 20px rgba(0,0,0,0.06)"}}>
        {TABS.map(({id,Icon,label})=>{
          const active=tab===id;
          return (
            <button key={id} onClick={()=>setTab(id)} style={{border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0"}}>
              <div style={{width:40,height:28,borderRadius:20,background:active?C.commit+"18":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon size={18} color={active?C.commit:C.muted} strokeWidth={active?2.5:1.8}/>
              </div>
              <span style={{fontSize:10,fontWeight:active?700:400,color:active?C.commit:C.muted,fontFamily:FB}}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
