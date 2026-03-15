import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000";

function stockClass(stock) {
  if (stock <= 0) return "out";
  if (stock === 1) return "crit";
  if (stock <= 5) return "few";
  return "ok";
}
function stockLabel(stock) {
  if (stock <= 0) return "SOLD OUT";
  if (stock === 1) return "1 LEFT — LAST ONE";
  if (stock <= 5) return `${stock} LEFT`;
  return `${stock} IN STOCK`;
}
function fmtPrice(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
function fmtTime(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}); }
  catch { return iso; }
}
function saleActive(p) {
  const now = Date.now();
  const s = p.saleStart ? new Date(p.saleStart).getTime() : 0;
  const e = p.saleEnd   ? new Date(p.saleEnd).getTime()   : Infinity;
  return now >= s && now <= e;
}
function getImg(p) {
  // if backend product has an image field, use it
  if (p.image) return p.image;
  // otherwise match by product name keywords
  // (Product model has no image/category field, so we infer from name)
  const n = (p.name || "").toLowerCase();
  if (/sneaker|shoe|air|jordan|nike|adidas|yeezy/.test(n))
    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format";
  if (/gpu|rtx|gtx|graphic|nvidia|amd/.test(n))
    return "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80&auto=format";
  if (/ticket|concert|tour|live|show|fest/.test(n))
    return "https://images.unsplash.com/photo-1501386761578-eaa54b915c11?w=600&q=80&auto=format";
  if (/hoodie|jacket|tee|shirt|apparel|cloth/.test(n))
    return "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80&auto=format";
  if (/phone|vision|apple|gadget|tech|keyboard|laptop|watch/.test(n))
    return "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80&auto=format";
  // category field fallback if it exists
  const map = {
    SNEAKERS:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format",
    GPU:"https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80&auto=format",
    CONCERT:"https://images.unsplash.com/photo-1501386761578-eaa54b915c11?w=600&q=80&auto=format",
    TECH:"https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80&auto=format",
    APPAREL:"https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80&auto=format",
  };
  return map[(p.category||"").toUpperCase()] ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format";
}
function getCat(p) {
  // category field if it exists, otherwise infer from name
  if (p.category) return p.category.toUpperCase();
  const n = (p.name || "").toLowerCase();
  if (/sneaker|shoe|air|jordan|nike|adidas/.test(n)) return "SNEAKERS";
  if (/gpu|rtx|gtx|nvidia|amd/.test(n))              return "GPU";
  if (/ticket|concert|tour|live/.test(n))             return "CONCERT";
  if (/hoodie|jacket|tee|shirt/.test(n))              return "APPAREL";
  if (/phone|vision|apple|tech|keyboard/.test(n))     return "TECH";
  return "DROP";
}

const TICKER = ["Flash drops — live stock","Free shipping on all orders","Inventory updates in real-time","First come, first served","No account needed to buy","Limited units — no restocks"];


const DEMO_PRODUCTS = [
  { _id:"d1", name:"Nike Air Max 97", price:18999, stock:12, description:"The OG silhouette. Limited colourway — only 12 pairs.", category:"SNEAKERS", image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format", saleStart:new Date(Date.now()-3600000).toISOString(), saleEnd:new Date(Date.now()+86400000).toISOString() },
  { _id:"d2", name:"NVIDIA RTX 5090", price:189999, stock:3, description:"Blackwell architecture. 32GB GDDR7. 3 units left.", category:"GPU", image:"https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80&auto=format", saleStart:new Date(Date.now()-1800000).toISOString(), saleEnd:new Date(Date.now()+43200000).toISOString() },
  { _id:"d3", name:"Taylor Swift — Eras Tour", price:12499, stock:50, description:"Official floor ticket. Eras Tour India leg.", category:"CONCERT", image:"https://images.unsplash.com/photo-1501386761578-eaa54b915c11?w=600&q=80&auto=format", saleStart:new Date(Date.now()-7200000).toISOString(), saleEnd:new Date(Date.now()+172800000).toISOString() },
  { _id:"d4", name:"Apple Vision Pro 2", price:329999, stock:0, description:"Spatial computing redefined. Sold out.", category:"TECH", image:"https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80&auto=format", saleStart:new Date(Date.now()-86400000).toISOString(), saleEnd:new Date(Date.now()-3600000).toISOString() },
  { _id:"d5", name:"Genesis Drop Hoodie", price:4999, stock:8, description:"400 GSM fleece. Limited run of 200 pieces.", category:"APPAREL", image:"https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80&auto=format", saleStart:new Date(Date.now()-900000).toISOString(), saleEnd:new Date(Date.now()+86400000).toISOString() },
  { _id:"d6", name:"Jordan 1 Retro High OG", price:22999, stock:1, description:"Chicago colourway. Deadstock. The grail.", category:"SNEAKERS", image:"https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&q=80&auto=format", saleStart:new Date(Date.now()-600000).toISOString(), saleEnd:new Date(Date.now()+21600000).toISOString() },
  { _id:"d7", name:"Kanye West — Donda Live", price:9999, stock:25, description:"Dome event. Immersive 360° stage. India only.", category:"CONCERT", image:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80&auto=format", saleStart:new Date(Date.now()-3600000).toISOString(), saleEnd:new Date(Date.now()+259200000).toISOString() },
  { _id:"d8", name:"Vault Mech Keyboard", price:13999, stock:5, description:"65% layout, gasket mount, POM plate.", category:"TECH", image:"https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80&auto=format", saleStart:new Date(Date.now()-1200000).toISOString(), saleEnd:new Date(Date.now()+86400000).toISOString() },
];

function Countdown() {
  const [t, setT] = useState({h:"00",m:"00",s:"00"});
  useEffect(()=>{
    const tick=()=>{
      const now=new Date(),mid=new Date(); mid.setHours(24,0,0,0);
      let d=Math.floor((mid-now)/1000);
      const h=Math.floor(d/3600); d%=3600; const m=Math.floor(d/60); const s=d%60;
      setT({h:String(h).padStart(2,"0"),m:String(m).padStart(2,"0"),s:String(s).padStart(2,"0")});
    };
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id);
  },[]);
  return <div className="fv-countdown">{[["h","HRS"],["m","MIN"],["s","SEC"]].map(([k,l])=>(
    <div key={k} className="fv-cd"><span className="fv-cd-n">{t[k]}</span><span className="fv-cd-l">{l}</span></div>
  ))}</div>;
}

function ToastStack({toasts}) {
  return <div className="fv-tstack">{toasts.map(t=>(
    <div key={t.id} className={`fv-toast ${t.cls}`}><span>{t.ico}</span><span>{t.msg}</span></div>
  ))}</div>;
}

export default function App() {
  const [products,  setProducts]  = useState([]);
  const [cart,      setCart]      = useState([]);
  const [theme,     setTheme]     = useState("dark");
  const [activeCat, setActiveCat] = useState("ALL");
  const [apiError,  setApiError]  = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [cartOpen,  setCartOpen]  = useState(false);
  const [modal,     setModal]     = useState(null);
  const [toasts,    setToasts]    = useState([]);
  const [maxStock,  setMaxStock]  = useState({});
  const [buying,    setBuying]    = useState(null);

  const addToast = useCallback((ico,msg,cls="")=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,ico,msg,cls}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3000);
  },[]);

  const fetchProducts = useCallback(async()=>{
    try {
      const res = await axios.get(`${API}/api/products`);
      // backend returns plain array: res.data is Product[]
      const data = Array.isArray(res.data) ? res.data : [];
      setProducts(data);
      setMaxStock(prev=>{
        const next={...prev};
        data.forEach(p=>{if(!next[p._id]||p.stock>next[p._id])next[p._id]=p.stock;});
        return next;
      });
      setApiError(false);
    } catch {
      setApiError(true);
      // show demo products when backend is offline
      if (products.length === 0) setProducts(DEMO_PRODUCTS);
    } finally { setLoading(false); }
  },[]);

  useEffect(()=>{ fetchProducts(); const id=setInterval(fetchProducts,5000); return()=>clearInterval(id); },[fetchProducts]);
  useEffect(()=>{ document.documentElement.setAttribute("data-theme",theme); },[theme]);
  useEffect(()=>{
    const h=e=>{ if(e.key==="Escape"){setModal(null);setCartOpen(false);} };
    window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h);
  },[]);

  const buyProduct = async(id)=>{
    const p=products.find(x=>x._id===id); if(!p||p.stock<=0) return;
    setBuying(id); setModal({product:p,state:"buying"});
    try {
      const res = await axios.post(`${API}/api/products/buy/${id}`);
      // backend returns: { message: "Purchase successful", remainingStock: number }
      const remaining = res.data.remainingStock ?? Math.max(0, p.stock - 1);
      // generate a frontend order ID since backend doesn't return one
      const orderId = "FV-" + Date.now().toString(36).toUpperCase();
      setProducts(prev=>prev.map(x=>x._id===id?{...x,stock:remaining}:x));
      setModal({product:p,state:"success",orderId,remaining});
      addToast("✓",`${p.name} secured!`,"ok");
    } catch(err) {
      // exact error messages from backend:
      // "Product sold out" | "Sale has not started yet" | "Sale has ended" | "Product not found"
      const msg = err.response?.data?.message || "Purchase failed";
      const soldOut = msg === "Product sold out";
      const notStarted = msg === "Sale has not started yet";
      const ended = msg === "Sale has ended";
      fetchProducts();
      if (soldOut) {
        setModal({product:p, state:"soldout", msg:"This product is sold out."});
        addToast("✕","Sold out — someone was faster","err");
      } else if (notStarted) {
        setModal({product:p, state:"error", msg:"The sale hasn't started yet. Check back later."});
        addToast("⚠","Sale not started yet","warn");
      } else if (ended) {
        setModal({product:p, state:"error", msg:"The sale has ended for this product."});
        addToast("⚠","Sale has ended","warn");
      } else {
        setModal({product:p, state:"error", msg});
        addToast("⚠", msg, "warn");
      }
    } finally { setBuying(null); }
  };

  const addToCart = p=>{
    if(!p||p.stock<=0) return;
    setCart(prev=>{ const ex=prev.find(c=>c.product._id===p._id); if(ex) return prev.map(c=>c.product._id===p._id?{...c,qty:Math.min(c.qty+1,p.stock)}:c); return [...prev,{product:p,qty:1}]; });
    addToast("✓",`${p.name} added`,"ok");
  };
  const removeFromCart = id=>setCart(prev=>prev.filter(c=>c.product._id!==id));
  const updateQty = (id,d)=>setCart(prev=>prev.map(c=>c.product._id!==id?c:{...c,qty:c.qty+d}).filter(c=>c.qty>0));
  const clearCart = ()=>setCart([]);
  const cartCount = cart.reduce((s,c)=>s+c.qty,0);
  const cartSub   = cart.reduce((s,c)=>s+c.product.price*c.qty,0);
  const cartGst   = Math.round(cartSub*0.18);

  const checkoutCart = async()=>{
    setCartOpen(false); let ok=0,fail=0;
    for(const item of [...cart]) for(let i=0;i<item.qty;i++) {
      try { await axios.post(`${API}/api/products/buy/${item.product._id}`); ok++; setProducts(prev=>prev.map(x=>x._id===item.product._id?{...x,stock:Math.max(0,x.stock-1)}:x)); }
      catch(e){ fail++; addToast("✕",`${item.product.name}: ${e.response?.data?.message||"failed"}`,"err"); }
    }
    setCart([]); fetchProducts();
    if(ok>0)   addToast("✓",`${ok} item${ok>1?"s":""} ordered!`,"ok");
    if(fail>0) addToast("⚠",`${fail} failed`,"warn");
  };

  const cats     = ["ALL",...new Set(products.map(getCat))];
  const filtered = activeCat==="ALL"?products:products.filter(p=>getCat(p)===activeCat);
  const spct     = p=>Math.max(4,Math.round((p.stock/Math.max(maxStock[p._id]||p.stock,1))*100));

  const fallback = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";
  const onImgErr = e=>{ e.target.src=fallback; };

  return <>
    <div className="fv-root">

      <nav className="fv-nav">
        <div className="fv-logo" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>FLASH<em>VAULT</em></div>
        <div className="fv-nav-mid">
          {["Drops","Sneakers","Electronics","Apparel"].map(l=>(
            <button key={l} className="fv-nav-link" onClick={()=>document.getElementById("drops")?.scrollIntoView({behavior:"smooth"})}>{l}</button>
          ))}
        </div>
        <div className="fv-nav-right">
          <button className="fv-tbtn" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}>{theme==="dark"?"☀ LIGHT":"☾ DARK"}</button>
          <button className="fv-ibtn" onClick={()=>setCartOpen(true)}>🛒{cartCount>0&&<span className="fv-cbadge">{cartCount}</span>}</button>
        </div>
      </nav>

      <div className="fv-ticker">
        <div className="fv-ticker-inner">
          {[...TICKER,...TICKER].map((t,i)=><span key={i} className="fv-ti">{t}<span className="sep">◆</span></span>)}
        </div>
      </div>

      <div className="fv-hero">
        <div className="fv-hero-bg"/>
        <div className="fv-hero-content">
          <div className="fv-hero-tag">Limited Edition Releases</div>
          <div className="fv-live-pill"><div className="fv-live-dot"/>DROP LIVE NOW</div>
          <h1 className="fv-h1"><span className="c1">TONIGHT</span><span className="c2">ONLY</span><span className="c3">THE LUCKY</span></h1>
          <div className="fv-hero-actions">
            <button className="fv-btn-hero" onClick={()=>document.getElementById("drops")?.scrollIntoView({behavior:"smooth"})}>⚡ Shop Drops</button>
            <button className="fv-btn-ghost" onClick={fetchProducts}>↺ Refresh Stock</button>
          </div>
          <Countdown/>
        </div>
        <div className="fv-hero-visual">
          <div className="fv-ring-wrap">
            <div className="fv-ring fv-r1"/><div className="fv-ring fv-r2"/><div className="fv-ring fv-r3"/>
            <div className="fv-hero-emoji">⚡</div>
          </div>
        </div>
      </div>

      <div className="fv-sec" id="drops">
        <div className="fv-sec-label">Fresh stock from the vault</div>
        <div className="fv-sec-title">ALL <span className="hl">DROPS</span></div>
        {apiError&&<div className="fv-apierr">⚠  Backend at <strong style={{color:"var(--warn)"}}>{API}/api/products</strong> is unreachable. Update the <code>API</code> constant in <code>App.jsx</code>.</div>}
        <div className="fv-filters">{cats.map(c=><button key={c} className={`fv-pill ${c===activeCat?"active":""}`} onClick={()=>setActiveCat(c)}>{c}</button>)}</div>
        <div className="fv-grid">
          {loading?[1,2,3,4].map(i=><div key={i} className="fv-skel"/>):filtered.map(p=>{
            const s=stockClass(p.stock),pct=spct(p),sold=p.stock<=0,active=saleActive(p);
            let bCls="avail",bTxt="Buy Now";
            if(sold){bCls="out";bTxt="Sold Out";}
            else if(s==="crit"){bCls="few";bTxt="Buy Now — Last One!";}
            else if(s==="few"){bCls="few";bTxt=`Buy Now — ${p.stock} Left`;}
            return(
              <div key={p._id} className={`fv-card ${sold?"sold":""}`} onClick={()=>setModal({product:p,state:"detail"})}>
                <div className="fv-card-img">
                  <img src={getImg(p)} alt={p.name} onError={onImgErr} loading="lazy"/>
                  <div className="fv-img-overlay"/>
                  <div className="fv-badges">
                    {sold&&<span className="fv-badge fv-badge-sold">Sold Out</span>}
                    {!sold&&s==="crit"&&<span className="fv-badge fv-badge-hot">🔥 Last One</span>}
                    {!sold&&s==="few"&&<span className="fv-badge fv-badge-few">⚠ Few Left</span>}
                    {!sold&&active&&s==="ok"&&<span className="fv-badge fv-badge-live">Live Drop</span>}
                    {!sold&&!active&&<span className="fv-badge fv-badge-new">Upcoming</span>}
                  </div>
                </div>
                <div className="fv-card-body">
                  <div className="fv-card-cat">{getCat(p)}</div>
                  <div className="fv-card-name">{p.name}</div>
                  <div className="fv-card-desc">{p.description||"Limited edition drop."}</div>
                  <div className="fv-card-price">{fmtPrice(p.price)}</div>
                  <div className="fv-stock-row"><span className="fv-stock-lbl">STOCK</span><span className={`fv-stock-val ${s}`}>{stockLabel(p.stock)}</span></div>
                  <div className="fv-sbar"><div className={`fv-sfill ${s}`} style={{width:`${pct}%`}}/></div>
                  <div className="fv-sale-info"><div className={`fv-sdot ${active?"on":"off"}`}/>{active?"Sale active now":`Opens: ${fmtTime(p.saleStart)}`}</div>
                  <button className={`fv-btn-buy ${buying===p._id?"loading":bCls}`} disabled={sold||buying===p._id} onClick={e=>{e.stopPropagation();buyProduct(p._id);}}>
                    {buying===p._id?"Processing...":bTxt}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="fv-footer">
        <div className="fv-fi">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:24,marginBottom:32}}>
            <div><div className="fv-flogo">⚡ FLASHVAULT</div><div className="fv-ftag" style={{marginTop:6}}>LIMITED DROPS. REAL STOCK. NO WAITING.</div></div>
            <div className="fv-flinks">{["About","How It Works","Upcoming Drops","Shipping","Contact"].map(l=><button key={l} className="fv-flink">{l}</button>)}</div>
          </div>
        </div>
      </footer>
    </div>

    {modal&&(
      <div className="fv-overlay open" onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
        <div className="fv-modal">
          <div className="fv-mhd">
            <div className="fv-mttl">{modal.state==="success"?"Order Confirmed":modal.state==="soldout"?"Sold Out":modal.state==="error"?"Error":modal.product.name}</div>
            <button className="fv-mclose" onClick={()=>setModal(null)}>✕</button>
          </div>
          <div className="fv-mbody">
            {modal.state==="buying"&&(
              <div className="fv-processing">
                <div className="fv-spin">⚡</div>
                <div style={{fontFamily:"var(--fd)",fontSize:"1.5rem",letterSpacing:2,color:"var(--accent)",marginTop:16}}>PROCESSING ORDER</div>
                <div style={{fontFamily:"var(--fm)",fontSize:".65rem",color:"var(--text3)",marginTop:8,letterSpacing:1}}>Checking stock & securing your item...</div>
              </div>
            )}
            {modal.state==="detail"&&(()=>{
              const p=modal.product,s=stockClass(p.stock),sold=p.stock<=0;
              let bCls="avail",bTxt="⚡ Buy Now — No Account Needed";
              if(sold){bCls="out";bTxt="Sold Out";}
              else if(s==="crit"){bCls="few";bTxt="⚠ Buy Now — Last One!";}
              else if(s==="few"){bCls="few";bTxt=`⚠ Buy Now — Only ${p.stock} Left`;}
              return(<>
                <div className="fv-m-img"><img src={getImg(p)} alt={p.name} onError={onImgErr}/></div>
                <div className="fv-m-meta">
                  <div className="fv-m-cat">{getCat(p)}</div>
                  <div className="fv-m-name">{p.name}</div>
                  <div className="fv-m-desc">{p.description||"Limited edition drop."}</div>
                  <div className="fv-m-price">{fmtPrice(p.price)}</div>
                </div>
                <div className="fv-m-stock">
                  <div className="fv-m-stock-row"><span className="fv-m-slbl">Units Remaining</span><span className={`fv-m-snum ${s}`}>{sold?"SOLD OUT":p.stock}</span></div>
                  <div className="fv-sbar" style={{height:6}}><div className={`fv-sfill ${s}`} style={{width:`${spct(p)}%`}}/></div>
                </div>
                <div className="fv-m-sale">
                  <div className="fv-m-si"><label>Sale Opens</label><span>{fmtTime(p.saleStart)}</span></div>
                  <div className="fv-m-si"><label>Sale Closes</label><span>{fmtTime(p.saleEnd)}</span></div>
                </div>
                <button className={`fv-btn-buy ${buying===p._id?"loading":bCls}`} disabled={sold||buying===p._id} onClick={()=>buyProduct(p._id)}>
                  {buying===p._id?"Processing...":bTxt}
                </button>
                <p style={{fontFamily:"var(--fm)",fontSize:".58rem",color:"var(--text3)",textAlign:"center",marginTop:10,letterSpacing:.5}}>No account needed · Inventory is live · First come, first served</p>
              </>);
            })()}
            {modal.state==="success"&&(<>
              <div className="fv-m-img" style={{height:180}}><img src={getImg(modal.product)} alt={modal.product.name} onError={onImgErr}/></div>
              <div className="fv-rbox ok">
                <div className="fv-r-ico">✅</div>
                <div className="fv-r-ttl ok">It&apos;s yours!</div>
                <div className="fv-r-sub">{modal.product.name} has been secured.</div>
                <div className="fv-oid">Order #{modal.orderId}</div>
              </div>
              <div style={{fontFamily:"var(--fm)",fontSize:".68rem",color:"var(--text3)",marginBottom:16,textAlign:"center"}}>
                {modal.remaining>0?`${modal.remaining} unit${modal.remaining>1?"s":""} remaining`:"You got the last one!"}
              </div>
              <button className="fv-btn-buy avail" onClick={()=>setModal(null)}>Continue Shopping</button>
            </>)}
            {modal.state==="soldout"&&(<>
              <div className="fv-m-img" style={{height:180,opacity:.5}}><img src={getImg(modal.product)} alt={modal.product.name} onError={onImgErr}/></div>
              <div className="fv-rbox err">
                <div className="fv-r-ico">❌</div>
                <div className="fv-r-ttl err">Just Sold Out</div>
                <div className="fv-r-sub">Someone got there first. <strong>No charge was applied.</strong></div>
              </div>
              <p style={{fontFamily:"var(--fm)",fontSize:".65rem",color:"var(--text3)",textAlign:"center",marginBottom:16}}>{modal.msg}</p>
              <div style={{display:"flex",gap:10}}>
                <button className="fv-btn-buy out" style={{flex:1}} onClick={()=>setModal(null)}>Close</button>
                <button className="fv-btn-buy avail" style={{flex:1}} onClick={()=>setModal(null)}>See Other Drops</button>
              </div>
            </>)}
            {modal.state==="error"&&(
              <div className="fv-rbox err">
                <div className="fv-r-ico">⚠\ufe0f</div>
                <div className="fv-r-ttl err">Something went wrong</div>
                <div className="fv-r-sub">{modal.msg}</div>
                <div style={{display:"flex",gap:10,marginTop:16}}>
                  <button className="fv-btn-buy out" style={{flex:1}} onClick={()=>setModal(null)}>Close</button>
                  <button className="fv-btn-buy avail" style={{flex:1}} onClick={()=>setModal({product:modal.product,state:"detail"})}>Retry</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    <div className={`fv-d-overlay ${cartOpen?"open":""}`} onClick={()=>setCartOpen(false)}/>
    <div className={`fv-drawer ${cartOpen?"open":""}`}>
      <div className="fv-dhd">
        <div className="fv-dttl">YOUR CART</div>
        <div className="fv-dact">
          <button className="fv-bclr" onClick={clearCart}>Clear all</button>
          <button className="fv-ibtn" onClick={()=>setCartOpen(false)} style={{width:32,height:32,fontSize:".85rem"}}>✕</button>
        </div>
      </div>
      <div className="fv-dbody">
        {cart.length===0?(<div className="fv-dempty"><div className="fv-dempty-ico">🛒</div><div>Your cart is empty</div><div style={{fontSize:".62rem",opacity:.6}}>Add items from the drops above</div></div>)
        :cart.map(c=>(
          <div key={c.product._id} className="fv-ci">
            <img className="fv-ci-img" src={getImg(c.product)} alt={c.product.name} onError={e=>{e.target.src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=70";}}/>
            <div className="fv-ci-info">
              <div className="fv-ci-name">{c.product.name}</div>
              <div className="fv-ci-price">{fmtPrice(c.product.price*c.qty)}</div>
              <div className="fv-ci-ctrl">
                <button className="fv-qbtn" onClick={()=>updateQty(c.product._id,-1)}>−</button>
                <span className="fv-qnum">{c.qty}</span>
                <button className="fv-qbtn" onClick={()=>updateQty(c.product._id,1)}>+</button>
                <button className="fv-cirm" onClick={()=>removeFromCart(c.product._id)}>✕ Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {cart.length>0&&(
        <div className="fv-dft">
          <div className="fv-df-row"><span>Subtotal</span><span>{fmtPrice(cartSub)}</span></div>
          <div className="fv-df-row"><span>Shipping</span><span style={{color:"var(--success)"}}>FREE</span></div>
          <div className="fv-df-row"><span>GST (18%)</span><span>{fmtPrice(cartGst)}</span></div>
          <div className="fv-df-tot"><span>TOTAL</span><span>{fmtPrice(cartSub+cartGst)}</span></div>
          <button className="fv-btn-buy avail" style={{fontSize:"1rem"}} onClick={checkoutCart}>Checkout →</button>
        </div>
      )}
    </div>

    <ToastStack toasts={toasts}/>
  </>;
}