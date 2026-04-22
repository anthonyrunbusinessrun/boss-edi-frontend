import { useState, useEffect, useCallback } from "react";

const API = "https://boss-edi-connector-production.up.railway.app";

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Lato:wght@100;300;400;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --navy:#0A1220; --navy2:#111C2E; --blue1:#0D1B35; --blue2:#1A3A6B;
    --blue3:#2E5FA3; --blue4:#5080C0; --blue5:#8299C0;
    --red1:#7A0000; --red2:#AD0000; --red3:#D52121;
    --white:#FFFFFF; --off:#C8D4E8; --dim:#5E7399;
    --border:rgba(46,95,163,.18);
    --blue-g:linear-gradient(135deg,#0A1A38 0%,#0D2557 50%,#1A4090 100%);
    --red-g:linear-gradient(135deg,#7A0000 0%,#AD0000 60%,#D52121 100%);
    --glow-b:0 0 24px rgba(46,95,163,.35);
    --glow-r:0 0 20px rgba(173,0,0,.45);
  }
  html,body,#root{height:100%;}
  body{font-family:'Lato',sans-serif;background:var(--navy);color:var(--white);overflow-x:hidden;}
  ::-webkit-scrollbar{width:6px;}
  ::-webkit-scrollbar-track{background:var(--navy);}
  ::-webkit-scrollbar-thumb{background:var(--blue3);border-radius:3px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-10px);}to{opacity:1;transform:translateX(0);}}
  .fade1{animation:fadeUp .35s ease both;}
  .fade2{animation:fadeUp .35s .07s ease both;}
  .fade3{animation:fadeUp .35s .14s ease both;}
  .fade4{animation:fadeUp .35s .21s ease both;}
`;

const R = (n) => ({ fontFamily:"'Rajdhani',sans-serif", ...n });

function Badge({ type }) {
  const map = {
    new: ["#3B82F6","rgba(59,130,246,.12)","NEW ORDER"],
    update: ["#F59E0B","rgba(245,158,11,.12)","UPDATE"],
    cancel: ["#EF4444","rgba(239,68,68,.12)","CANCELLED"],
    sent: ["#10B981","rgba(16,185,129,.12)","SHIPPED"],
    received: ["#8299C0","rgba(130,153,192,.12)","RECEIVED"],
    inbound: ["#8299C0","rgba(130,153,192,.12)","INBOUND"],
    outbound: ["#D52121","rgba(213,33,33,.12)","OUTBOUND"],
  };
  const [c,bg,label] = map[type?.toLowerCase()] ?? ["#8299C0","rgba(130,153,192,.1)",type?.toUpperCase()||"--"];
  return <span style={{color:c,background:bg,border:`1px solid ${c}33`,padding:"2px 9px",borderRadius:3,fontSize:10,...R({fontWeight:700,letterSpacing:1})}}>{label}</span>;
}

function Stat({ label, value, sub, accent, delay }) {
  return (
    <div className={`fade${delay}`} style={{background:"linear-gradient(135deg,rgba(13,27,53,.95),rgba(18,35,70,.9))",border:`1px solid ${accent}22`,borderLeft:`3px solid ${accent}`,borderRadius:7,padding:"18px 22px",boxShadow:"0 4px 20px rgba(0,0,0,.25)"}}>
      <div style={{fontSize:10,color:"var(--dim)",marginBottom:8,...R({fontWeight:700,letterSpacing:2})}}>{label}</div>
      <div style={{fontSize:38,lineHeight:1,...R({fontWeight:700})}}>{value}</div>
      {sub && <div style={{fontSize:11,color:accent,marginTop:5}}>{sub}</div>}
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 14px",border:"none",cursor:"pointer",borderRadius:5,background:active?"linear-gradient(90deg,rgba(46,95,163,.22),rgba(46,95,163,.04))":"transparent",color:active?"var(--white)":"var(--dim)",borderLeft:`2px solid ${active?"var(--blue4)":"transparent"}`,transition:"all .2s",textAlign:"left",...R({fontSize:13,fontWeight:700,letterSpacing:1})}}>
      <span style={{fontSize:15}}>{icon}</span>{label}
    </button>
  );
}

function Spinner() {
  return <div style={{width:28,height:28,border:"2px solid var(--blue3)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>;
}

function DispatchModal({ order, onClose, onDispatch }) {
  const [f,setF] = useState({
    asnId:`ASN-${Date.now()}`,trailerNumber:"",tractorNumber:"",
    plateNumber:"",plateState:"",shipDate:"",eta:"",
    originFacility:order?.origin_facility||"",
    destinationFacility:order?.destination_facility||""
  });
  const [busy,setBusy] = useState(false);
  const set = (k,v) => setF(p => ({...p,[k]:v}));
  const go = async () => {
    setBusy(true);
    const items = (order?.lines||[]).map(l => ({sku:l.sku,quantity:l.quantity}));
    await onDispatch({...f,doNumber:order.do_number,items});
    setBusy(false);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"linear-gradient(135deg,#0A1A38 0%,#0E2048 100%)",border:"1px solid rgba(46,95,163,.45)",borderRadius:10,padding:32,width:580,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:24}}>
          <div>
            <div style={{fontSize:22,letterSpacing:1,...R({fontWeight:700})}}>DISPATCH SHIPMENT</div>
            <div style={{color:"var(--dim)",fontSize:12,marginTop:3}}>DO {order?.do_number} to {order?.destination_facility}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--dim)",fontSize:18,cursor:"pointer"}}>X</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["ASN ID","asnId",true],["TRAILER NUMBER","trailerNumber"],["TRACTOR NUMBER","tractorNumber"],
            ["PLATE NUMBER","plateNumber"],["PLATE STATE","plateState"],
            ["SHIP DATE (CCYYMMDD)","shipDate"],["ETA (CCYYMMDD)","eta"],
            ["ORIGIN FACILITY","originFacility"],["DESTINATION FACILITY","destinationFacility"]
          ].map(([label,key,span]) => (
            <div key={key} style={{gridColumn:span?"1/-1":undefined}}>
              <label style={{display:"block",fontSize:10,color:"var(--dim)",marginBottom:4,...R({fontWeight:700,letterSpacing:1})}}>{label}</label>
              <input value={f[key]} onChange={e=>set(key,e.target.value)} style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(130,153,192,.2)",borderRadius:4,color:"var(--white)",fontSize:13,outline:"none"}}/>
            </div>
          ))}
        </div>
        {order?.lines?.length > 0 && (
          <div style={{marginTop:20}}>
            <div style={{fontSize:10,color:"var(--dim)",marginBottom:8,...R({fontWeight:700,letterSpacing:2})}}>LINE ITEMS</div>
            {order.lines.map(l => (
              <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:"rgba(46,95,163,.08)",borderRadius:4,marginBottom:5}}>
                <span style={{...R({fontWeight:700})}}>{l.sku}</span>
                <span style={{color:"var(--blue5)",...R({fontWeight:600})}}>{l.quantity} {l.unit||"UN"}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:10,marginTop:24}}>
          <button onClick={onClose} style={{flex:1,padding:"11px 0",background:"transparent",border:"1px solid rgba(130,153,192,.25)",borderRadius:5,color:"var(--dim)",cursor:"pointer",...R({fontWeight:700,fontSize:13,letterSpacing:1})}}>CANCEL</button>
          <button onClick={go} disabled={busy} style={{flex:2,padding:"11px 0",background:"var(--red-g)",border:"none",borderRadius:5,color:"var(--white)",cursor:"pointer",...R({fontWeight:700,fontSize:14,letterSpacing:2})}}>{busy?"SENDING 856...":"DISPATCH & SEND 856"}</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab,setTab] = useState("orders");
  const [orders,setOrders] = useState([]);
  const [logs,setLogs] = useState([]);
  const [health,setHealth] = useState(null);
  const [loading,setLoading] = useState(true);
  const [expanded,setExpanded] = useState(null);
  const [dispatch,setDispatch] = useState(null);
  const [toast,setToast] = useState(null);
  const [testRes,setTestRes] = useState(null);
  const [testBusy,setTestBusy] = useState(false);
  const [lastRefresh,setLast] = useState(null);

  const showToast = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const fetchAll = useCallback(async () => {
    try {
      const [o,l,h] = await Promise.all([
        fetch(`${API}/orders`).then(r=>r.ok?r.json():null).catch(()=>null),
        fetch(`${API}/orders/log/all`).then(r=>r.ok?r.json():null).catch(()=>null),
        fetch(`${API}/edi/health`).then(r=>r.ok?r.json():null).catch(()=>null),
      ]);
      if(o) setOrders(o.orders||[]);
      if(l) setLogs(l.log||[]);
      setHealth(h);
      setLast(new Date());
    } catch(e) {}
    setLoading(false);
  },[]);

  useEffect(()=>{ fetchAll(); const t=setInterval(fetchAll,15000); return()=>clearInterval(t); },[fetchAll]);

  const doDispatch = async (data) => {
    try {
      const r = await fetch(`${API}/shipments/dispatch`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      const d = await r.json();
      if(d.success){ showToast(`856 ASN sent for DO ${data.doNumber}`); setDispatch(null); fetchAll(); }
      else showToast(d.error||"Dispatch failed","err");
    } catch(e){ showToast("Connection error","err"); }
  };

  const runTest = async () => {
    setTestBusy(true); setTestRes(null);
    try {
      const t0=Date.now();
      const d=await fetch(`${API}/edi/health`).then(r=>r.json());
      setTestRes({ok:true,data:d,ms:Date.now()-t0});
    } catch(e){ setTestRes({ok:false,err:e.message}); }
    setTestBusy(false);
  };

  const total=orders.length;
  const active=orders.filter(o=>o.order_type==="new").length;
  const in850=logs.filter(l=>l.message_type==="850").length;
  const out997=logs.filter(l=>l.message_type==="997").length;

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <div style={{display:"flex",minHeight:"100vh"}}>
        {/* Sidebar */}
        <aside style={{width:224,background:"linear-gradient(180deg,#060E1C 0%,#091528 100%)",borderRight:"1px solid rgba(46,95,163,.18)",display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,height:"100vh",zIndex:50}}>
          <div style={{padding:"22px 20px 18px",borderBottom:"1px solid rgba(46,95,163,.12)",marginBottom:14}}>
            <div style={{fontSize:26,lineHeight:1,...R({fontWeight:700}),background:"linear-gradient(90deg,#fff 0%,#8299C0 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:3}}>RAY LAND</div>
            <div style={{fontSize:9,color:"var(--red3)",letterSpacing:3,marginTop:2,...R({fontWeight:600})}}>EDI COMMAND CENTER</div>
            <div style={{marginTop:12,padding:"5px 10px",borderRadius:4,display:"inline-flex",alignItems:"center",gap:7,background:health?"rgba(16,185,129,.08)":"rgba(213,33,33,.08)",border:`1px solid ${health?"#10B98133":"#D5212133"}`}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:health?"#10B981":"#D52121",animation:health?"pulse 2s infinite":"none"}}/>
              <span style={{fontSize:9,...R({fontWeight:700,letterSpacing:1.5}),color:health?"#10B981":"#D52121"}}>{health?"SYSTEM ONLINE":"OFFLINE"}</span>
            </div>
          </div>
          <nav style={{padding:"0 10px",display:"flex",flexDirection:"column",gap:3}}>
            <NavBtn icon="📋" label="ORDERS" active={tab==="orders"} onClick={()=>setTab("orders")}/>
            <NavBtn icon="🚛" label="SHIPMENTS" active={tab==="shipments"} onClick={()=>setTab("shipments")}/>
            <NavBtn icon="📡" label="EDI LOG" active={tab==="log"} onClick={()=>setTab("log")}/>
            <NavBtn icon="🔧" label="SYSTEM" active={tab==="test"} onClick={()=>setTab("test")}/>
          </nav>
          <div style={{marginTop:"auto",padding:"16px 16px 20px",borderTop:"1px solid rgba(46,95,163,.1)"}}>
            <div style={{fontSize:9,color:"rgba(130,153,192,.4)",letterSpacing:1,...R({fontWeight:600}),marginBottom:4}}>ISA SENDER</div>
            <div style={{fontSize:11,color:"var(--blue5)",...R({fontWeight:700})}}>3863629312</div>
            <div style={{fontSize:9,color:"rgba(130,153,192,.3)",marginTop:10}}>{lastRefresh?`Updated ${lastRefresh.toLocaleTimeString()}`:"Connecting..."}</div>
          </div>
        </aside>

        {/* Main */}
        <main style={{marginLeft:224,flex:1,padding:"28px 30px",minHeight:"100vh"}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:26}}>
            <div>
              <div style={{fontSize:30,lineHeight:1,letterSpacing:2,...R({fontWeight:700})}}>{{"orders":"DISTRIBUTION ORDERS","shipments":"SHIPMENTS","log":"EDI TRANSACTION LOG","test":"SYSTEM STATUS"}[tab]}</div>
              <div style={{color:"var(--dim)",fontSize:11,marginTop:4,letterSpacing:1}}>FEMA LSCMS - Land Logistics - {new Date().toDateString().toUpperCase()}</div>
            </div>
            <button onClick={fetchAll} style={{padding:"8px 18px",background:"transparent",border:"1px solid rgba(130,153,192,.25)",borderRadius:5,color:"var(--dim)",cursor:"pointer",...R({fontWeight:700,fontSize:11,letterSpacing:2})}}>REFRESH</button>
          </div>

          {/* ORDERS */}
          {tab==="orders" && (
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:26}}>
                <Stat label="TOTAL ORDERS" value={total} sub="All time" accent="var(--blue3)" delay="1"/>
                <Stat label="ACTIVE ORDERS" value={active} sub="Awaiting dispatch" accent="var(--blue4)" delay="2"/>
                <Stat label="850s RECEIVED" value={in850} sub="From FEMA/LSCMS" accent="var(--blue5)" delay="3"/>
                <Stat label="997s SENT" value={out997} sub="Acknowledgments" accent="var(--red2)" delay="4"/>
              </div>
              {loading ? (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:60}}>
                  <Spinner/>
                  <div style={{color:"var(--dim)",fontSize:12,...R({letterSpacing:2})}}>LOADING ORDERS...</div>
                </div>
              ) : orders.length===0 ? (
                <div style={{textAlign:"center",padding:"64px 0",background:"rgba(13,27,53,.5)",border:"1px solid var(--border)",borderRadius:8}}>
                  <div style={{fontSize:52,marginBottom:16}}>📭</div>
                  <div style={{fontSize:20,letterSpacing:2,...R({fontWeight:700}),marginBottom:8}}>NO ORDERS YET</div>
                  <div style={{color:"var(--dim)",fontSize:13}}>Waiting for FEMA to transmit EDI 850 purchase orders via GEX</div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {orders.map((o,i) => {
                    const open = expanded===o.do_number;
                    return (
                      <div key={o.do_number} onClick={()=>setExpanded(open?null:o.do_number)}
                        style={{background:open?"linear-gradient(135deg,rgba(13,27,53,.98),rgba(20,40,80,.95))":"linear-gradient(135deg,rgba(13,27,53,.9),rgba(16,30,60,.85))",border:`1px solid ${open?"rgba(46,95,163,.55)":"rgba(130,153,192,.1)"}`,borderRadius:7,padding:"15px 18px",cursor:"pointer",transition:"all .2s",animation:`fadeUp .3s ease ${i*.04}s both`}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{display:"flex",alignItems:"center",gap:14}}>
                            <div>
                              <div style={{fontSize:18,letterSpacing:1,...R({fontWeight:700})}}>{o.do_number}</div>
                              <div style={{color:"var(--dim)",fontSize:12,marginTop:2}}>{o.origin_facility||"--"} to {o.destination_facility||"--"}</div>
                            </div>
                            <Badge type={o.order_type}/>
                            {o.status && <Badge type={o.status}/>}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:14}}>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:9,color:"var(--dim)",...R({letterSpacing:1.5,fontWeight:700})}}>REQ DELIVERY</div>
                              <div style={{fontSize:13,...R({fontWeight:700})}}>{o.requested_delivery||"--"}</div>
                            </div>
                            {o.order_type==="new" && (
                              <button onClick={e=>{e.stopPropagation();setDispatch(o);}}
                                style={{padding:"7px 16px",background:"var(--red-g)",border:"none",borderRadius:4,color:"var(--white)",cursor:"pointer",...R({fontWeight:700,fontSize:12,letterSpacing:2})}}>DISPATCH</button>
                            )}
                          </div>
                        </div>
                        {open && (
                          <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid rgba(130,153,192,.12)",animation:"slideIn .2s ease"}}>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:16}}>
                              {[["Fund Cite",o.fund_cite],["RRF Number",o.rrf_number],["Latest Arrival",o.latest_arrival],["Origin",o.origin_address],["Destination",o.destination_address],["Notes",o.notes]].filter(([,v])=>v).map(([k,v])=>(
                                <div key={k}><div style={{fontSize:9,color:"var(--dim)",marginBottom:3,...R({fontWeight:700,letterSpacing:1.5})}}>{k.toUpperCase()}</div><div style={{fontSize:12}}>{v}</div></div>
                              ))}
                            </div>
                            {o.lines?.length>0 && (
                              <>
                                <div style={{fontSize:9,color:"var(--dim)",marginBottom:8,...R({fontWeight:700,letterSpacing:2})}}>LINE ITEMS</div>
                                {o.lines.map(l=>(
                                  <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"rgba(46,95,163,.07)",border:"1px solid rgba(46,95,163,.12)",borderRadius:4,marginBottom:5}}>
                                    <div><span style={{...R({fontWeight:700,fontSize:14})}}>{l.sku}</span>{l.description&&<span style={{color:"var(--dim)",fontSize:11,marginLeft:10}}>{l.description}</span>}</div>
                                    <div style={{...R({fontWeight:700,fontSize:13}),color:"var(--blue5)"}}>{l.quantity} {l.unit||"UN"}</div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* LOG */}
          {tab==="log" && (
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
                <Stat label="TOTAL MESSAGES" value={logs.length} accent="var(--blue3)" delay="1"/>
                <Stat label="INBOUND 850s" value={logs.filter(l=>l.direction==="inbound").length} accent="var(--blue5)" delay="2"/>
                <Stat label="OUTBOUND 997s" value={logs.filter(l=>l.direction==="outbound").length} accent="var(--red2)" delay="3"/>
              </div>
              {logs.length===0 ? (
                <div style={{textAlign:"center",padding:"64px 0",background:"rgba(13,27,53,.5)",border:"1px solid var(--border)",borderRadius:8}}>
                  <div style={{fontSize:52,marginBottom:16}}>📡</div>
                  <div style={{fontSize:20,letterSpacing:2,...R({fontWeight:700}),marginBottom:8}}>NO TRANSACTIONS YET</div>
                  <div style={{color:"var(--dim)",fontSize:13}}>EDI messages will appear here once FEMA begins transmitting</div>
                </div>
              ) : (
                <div style={{background:"rgba(6,14,28,.85)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden"}}>
                  <div style={{display:"grid",gridTemplateColumns:"90px 70px 100px 130px 1fr",padding:"10px 20px",borderBottom:"1px solid var(--border)",background:"rgba(46,95,163,.07)"}}>
                    {["DIRECTION","TYPE","STATUS","DO NUMBER","TIMESTAMP"].map(h=><div key={h} style={{fontSize:9,color:"var(--dim)",...R({fontWeight:700,letterSpacing:1.5})}}>{h}</div>)}
                  </div>
                  {logs.map((l,i)=>(
                    <div key={l.id} style={{display:"grid",gridTemplateColumns:"90px 70px 100px 130px 1fr",padding:"11px 20px",borderBottom:"1px solid rgba(130,153,192,.05)",background:i%2===0?"transparent":"rgba(255,255,255,.01)",animation:`fadeUp .2s ease ${i*.025}s both`}}>
                      <div><Badge type={l.direction}/></div>
                      <div style={{...R({fontWeight:700,fontSize:15})}}>{l.message_type}</div>
                      <div><Badge type={l.status}/></div>
                      <div style={{fontSize:13,color:"var(--blue5)",...R({fontWeight:600})}}>{l.do_number||"--"}</div>
                      <div style={{fontSize:11,color:"var(--dim)"}}>{new Date(l.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TEST */}
          {tab==="test" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:900}}>
              <div className="fade1" style={{background:"linear-gradient(135deg,rgba(13,27,53,.95),rgba(18,36,70,.9))",border:"1px solid rgba(46,95,163,.3)",borderRadius:8,padding:28}}>
                <div style={{fontSize:17,letterSpacing:1,marginBottom:6,...R({fontWeight:700})}}>ENDPOINT HEALTH CHECK</div>
                <div style={{color:"var(--dim)",fontSize:12,marginBottom:18}}>Tests live connectivity to the BusinessOS EDI service</div>
                <div style={{background:"rgba(0,0,0,.35)",borderRadius:5,padding:"10px 14px",fontFamily:"monospace",fontSize:11,color:"var(--blue5)",marginBottom:18}}>GET {API}/edi/health</div>
                <button onClick={runTest} disabled={testBusy} style={{padding:"10px 24px",background:"var(--blue-g)",border:"none",borderRadius:5,color:"var(--white)",cursor:"pointer",...R({fontWeight:700,fontSize:13,letterSpacing:2})}}>{testBusy?"TESTING...":"RUN TEST"}</button>
                {testRes && (
                  <div style={{marginTop:20,padding:16,borderRadius:6,background:testRes.ok?"rgba(16,185,129,.07)":"rgba(213,33,33,.07)",border:`1px solid ${testRes.ok?"#10B98133":"#D5212133"}`}}>
                    <div style={{fontSize:15,marginBottom:10,color:testRes.ok?"#10B981":"#EF4444",...R({fontWeight:700})}}>{testRes.ok?"SYSTEM ONLINE":"FAILED"}</div>
                    {testRes.ok ? Object.entries(testRes.data).map(([k,v])=>(
                      <div key={k} style={{display:"flex",gap:12,fontSize:12,marginBottom:5}}>
                        <span style={{color:"var(--dim)",minWidth:110,...R({fontWeight:700})}}>{k.toUpperCase()}</span>
                        <span>{String(v)}</span>
                      </div>
                    )) : <div style={{color:"var(--dim)",fontSize:12}}>{testRes.err}</div>}
                    {testRes.ok && <div style={{display:"flex",gap:12,fontSize:12,marginTop:5}}><span style={{color:"var(--dim)",minWidth:110,...R({fontWeight:700})}}>LATENCY</span><span style={{color:"#10B981"}}>{testRes.ms}ms</span></div>}
                  </div>
                )}
              </div>
              <div className="fade2" style={{background:"linear-gradient(135deg,rgba(13,27,53,.95),rgba(18,36,70,.9))",border:"1px solid rgba(46,95,163,.3)",borderRadius:8,padding:28}}>
                <div style={{fontSize:17,letterSpacing:1,marginBottom:18,...R({fontWeight:700})}}>CONNECTION DETAILS</div>
                {[["Service URL",API],["EDI Inbound",`${API}/edi/inbound`],["Health Check",`${API}/edi/health`],["ISA Sender","12 / 3863629312"],["FEMA Test ISA","ZZ / 521227911TDL"],["FEMA Prod ISA","ZZ / 521227911"],["Protocol","HTTPS POST"],["Database","PostgreSQL - Railway"]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",gap:12,padding:"9px 0",borderBottom:"1px solid rgba(130,153,192,.07)",alignItems:"flex-start"}}>
                    <div style={{fontSize:9,color:"var(--dim)",minWidth:110,paddingTop:2,...R({fontWeight:700,letterSpacing:1})}}>{k}</div>
                    <div style={{fontSize:11,fontFamily:"monospace",color:"var(--blue5)",wordBreak:"break-all",lineHeight:1.5}}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="fade3" style={{gridColumn:"1/-1",background:"linear-gradient(135deg,rgba(173,0,0,.12),rgba(100,0,0,.08))",border:"1px solid rgba(213,33,33,.25)",borderRadius:8,padding:22,display:"flex",alignItems:"center",gap:18}}>
                <div style={{fontSize:36}}>!</div>
                <div>
                  <div style={{fontSize:16,...R({fontWeight:700,letterSpacing:1}),marginBottom:5}}>10 PENDING 850s AT DAAS</div>
                  <div style={{fontSize:12,color:"var(--off)",lineHeight:1.7}}>FEMA sent 10 EDI 850 POs on April 17 2026 with no route at GEX. Contact Lennette.1.Nemitz@dla.mil and Stephen.Morgan.ctr@dla.mil to enable routing and resend.</div>
                </div>
              </div>
            </div>
          )}

          {/* SHIPMENTS */}
          {tab==="shipments" && (
            <div style={{textAlign:"center",padding:"64px 0",background:"rgba(13,27,53,.5)",border:"1px solid var(--border)",borderRadius:8}}>
              <div style={{fontSize:52,marginBottom:16}}>🚛</div>
              <div style={{fontSize:20,letterSpacing:2,...R({fontWeight:700}),marginBottom:8}}>DISPATCH FROM ORDERS TAB</div>
              <div style={{color:"var(--dim)",fontSize:13}}>Select any active order and click DISPATCH to send an EDI 856 Advance Ship Notice to FEMA</div>
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",bottom:24,right:24,zIndex:2000,padding:"13px 20px",borderRadius:6,background:toast.type==="err"?"rgba(173,0,0,.97)":"rgba(16,185,129,.97)",border:`1px solid ${toast.type==="err"?"#D52121":"#10B981"}`,boxShadow:"0 8px 32px rgba(0,0,0,.5)",animation:"fadeUp .3s ease",...R({fontWeight:700,fontSize:13,letterSpacing:1})}}>{toast.msg}</div>
      )}

      {/* Dispatch Modal */}
      {dispatch && <DispatchModal order={dispatch} onClose={()=>setDispatch(null)} onDispatch={doDispatch}/>}
    </>
  );
}
