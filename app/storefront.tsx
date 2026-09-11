'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, Check, Download, ImageIcon, LockKeyhole, Minus, Plus, ShoppingBag, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type Product={id:number;name:string;price:number;category:string;note:string;tone:string;featured:boolean;hasImage?:boolean;imageVersion?:string};
type Cart=Record<number,number>;
type Order={id:number;customerName:string;phone:string;items:{name:string;price:number;qty:number}[];total:number;status:string;createdAt:string};
type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
const fallback:Product[]=[
  {id:1,name:'Oud El Malick',price:17000,category:'parfum-corps',note:'Oud puissant et boisé, sillage affirmé.',tone:'amber',featured:true},
  {id:2,name:'Rose de Yaye',price:15000,category:'parfum-corps',note:'Rose épanouie relevée de notes ambrées.',tone:'rose',featured:false},
  {id:3,name:'Nuit Dorée',price:19000,category:'parfum-corps',note:'Vanille, musc et une pointe de safran.',tone:'gold',featured:false},
  {id:6,name:'Brume Ndar',price:7500,category:'deodorant',note:'Fraîcheur d’agrumes et de musc.',tone:'mint',featured:false},
  {id:7,name:'Keur Santal',price:12500,category:'parfum-chambre',note:'Santal et ambre doux pour la maison.',tone:'violet',featured:false},
  {id:8,name:'Huile Mousso',price:9000,category:'huile',note:'Huile parfumée concentrée et enveloppante.',tone:'rose',featured:false},
  {id:9,name:'Coffret Teranga',price:29000,category:'coffret',note:'Trois signatures réunies en coffret.',tone:'gold',featured:false},
];
const categories=[['all','Tout voir'],['parfum-corps','Parfums de corps'],['deodorant','Déodorants'],['parfum-chambre','Parfums de chambre'],['huile','Huiles'],['coffret','Coffrets']];
const categoryName=(key:string)=>categories.find(([id])=>id===key)?.[1]||key;
const money=(n:number)=>`${new Intl.NumberFormat('fr-FR').format(n)} F`;
function BrandLogo({className='' }:{className?:string}){return <img className={`official-logo ${className}`} src="/logo-keur-yaye.jpg" alt="Logo KEUR YAYE"/>}
function Bottle({tone='gold'}:{tone?:string}){return <div className={`bottle bottle-${tone}`} aria-hidden="true"><span className="bottle-cap"/><span className="bottle-neck"/><span className="bottle-glass"><span className="bottle-label"><BrandLogo className="bottle-brand"/></span></span></div>}

export default function Storefront(){
  const [products,setProducts]=useState(fallback),[filter,setFilter]=useState('all'),[cart,setCart]=useState<Cart>({});
  const [cartOpen,setCartOpen]=useState(false),[checkoutOpen,setCheckoutOpen]=useState(false),[adminOpen,setAdminOpen]=useState(false);
  const [confirmed,setConfirmed]=useState(false),[name,setName]=useState(''),[phone,setPhone]=useState(''),[busy,setBusy]=useState(false);
  const [password,setPassword]=useState(''),[adminOk,setAdminOk]=useState(false),[adminError,setAdminError]=useState(''),[tab,setTab]=useState<'products'|'orders'>('products');
  const [orders,setOrders]=useState<Order[]>([]),[form,setForm]=useState({name:'',price:'',category:'parfum-corps',note:'',tone:'gold'});
  const [installPrompt,setInstallPrompt]=useState<InstallPromptEvent|null>(null),[uploading,setUploading]=useState<number|null>(null);
  const cartTouchStart=useRef(0);
  const loadProducts=()=>fetch('/api/store').then(r=>r.ok?r.json():Promise.reject()).then(setProducts).catch(()=>setProducts(fallback));
  useEffect(()=>{loadProducts();const capture=(event:Event)=>{event.preventDefault();setInstallPrompt(event as InstallPromptEvent)};window.addEventListener('beforeinstallprompt',capture);return()=>window.removeEventListener('beforeinstallprompt',capture)},[]);
  const items=useMemo(()=>Object.entries(cart).flatMap(([id,qty])=>{const p=products.find(x=>x.id===Number(id));return p?[{...p,qty}]:[]}),[cart,products]);
  const total=items.reduce((s,i)=>s+i.price*i.qty,0),count=items.reduce((s,i)=>s+i.qty,0);
  const add=(id:number)=>{setCart(c=>({...c,[id]:(c[id]||0)+1}));setCartOpen(true)};
  const qty=(id:number,d:number)=>setCart(c=>{const n={...c,[id]:(c[id]||0)+d};if(n[id]<=0)delete n[id];return n});
  const adminHeaders={'content-type':'application/json','x-admin-password':password};
  async function unlock(){setAdminError('');const r=await fetch('/api/store?orders=1',{headers:{'x-admin-password':password}});if(!r.ok){setAdminError('Mot de passe incorrect.');return}setOrders(await r.json());setAdminOk(true)}
  async function submitOrder(){if(!name.trim()||!phone.trim()||!items.length)return;setBusy(true);const r=await fetch('/api/store',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'order',customerName:name,phone,items})});setBusy(false);if(r.ok){setCart({});setConfirmed(true)}}
  async function addProduct(e:React.FormEvent){e.preventDefault();const r=await fetch('/api/store',{method:'POST',headers:adminHeaders,body:JSON.stringify({action:'product',...form})});if(r.ok){setForm({name:'',price:'',category:'parfum-corps',note:'',tone:'gold'});await loadProducts()}}
  async function removeProduct(id:number){await fetch(`/api/store?id=${id}`,{method:'DELETE',headers:{'x-admin-password':password}});await loadProducts()}
  async function uploadImage(id:number,file:File){setUploading(id);setAdminError('');try{const data=new FormData();data.set('image',file);const r=await fetch(`/api/images/${id}`,{method:'POST',headers:{'x-admin-password':password},body:data});if(!r.ok){const e=await r.json().catch(()=>({error:'Échec du téléversement'}));setAdminError(e.error||'Échec du téléversement');return}await loadProducts()}catch{setAdminError('Connexion interrompue. Réessayez.')}finally{setUploading(null)}}
  async function installApp(){if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;setInstallPrompt(null);return}alert('Sur iPhone : touchez le bouton Partager de Safari, puis « Sur l’écran d’accueil ».')}
  async function mark(id:number){await fetch('/api/store',{method:'POST',headers:adminHeaders,body:JSON.stringify({action:'status',id})});setOrders(o=>o.map(x=>x.id===id?{...x,status:'traitée'}:x))}
  const whatsapp=`https://wa.me/221780136079?text=${encodeURIComponent(`Bonjour KEUR YAYE, je souhaite commander :\n${items.map(i=>`- ${i.name} x${i.qty} (${money(i.price*i.qty)})`).join('\n')}\nTotal : ${money(total)}`)}`;
  return <main>
    <header className="site-header">
      <a href="#top" className="brand" aria-label="KEUR YAYE, accueil"><BrandLogo className="header-logo"/><span>KEUR <em>YAYE</em></span></a>
      <nav aria-label="Navigation principale"><a href="#collection">Collection</a><a href="#histoire">Notre maison</a></nav>
      <div className="header-actions"><Button className="install-button" variant="ghost" size="icon" aria-label="Installer l’application KEUR YAYE" onClick={installApp}><Download size={18}/></Button><Button className="bag-button" variant="ghost" size="icon" aria-label={`Ouvrir le panier, ${count} article(s)`} onClick={()=>setCartOpen(true)}><ShoppingBag size={18}/>{count>0&&<b>{count}</b>}</Button></div>
    </header>
    <section id="top" className="hero">
      <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
      <div className="hero-copy"><p className="eyebrow">Parfumerie sénégalaise · Dakar</p><h1>Le parfum,<br/><span>mémoire</span> d&apos;une maison.</h1><p className="hero-lede">Des oud et des eaux de parfum composés pour laisser une présence — intime, précieuse, inoubliable.</p><div className="hero-actions"><a className="primary-action" href="#collection">Découvrir la collection <ArrowDownRight size={17}/></a><a className="text-action" href="https://wa.me/221780136079">Commander sur WhatsApp</a></div></div>
      <div className="hero-product"><Bottle tone="gold"/><span>Oud El Malick</span></div><p className="hero-index">01 — 05</p>
    </section>
    <section id="collection" className="collection">
      <div className="section-heading"><div><p className="eyebrow">La collection</p><h2>Des essences qui<br/><em>vous ressemblent.</em></h2></div><p>Une sélection pensée à Dakar, entre chaleur des bois, fleurs solaires et sillages enveloppants.</p></div>
      <div className="filters" aria-label="Filtrer la collection">{categories.map(([key,label])=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{label}</button>)}</div>
      <div className="product-grid">{products.filter(p=>filter==='all'||p.category===filter).map((p,index)=><article className="product-card" key={p.id}><div className={`product-visual ${p.hasImage?'has-photo':''}`}><span className="product-number">{String(index+1).padStart(2,'0')}</span>{p.hasImage?<img src={`/api/images/${p.id}?v=${encodeURIComponent(p.imageVersion||'')}`} alt={p.name}/>:<Bottle tone={p.tone}/>}</div><div className="product-details"><p><span>{categoryName(p.category)}</span> · {p.note}</p><h3>{p.name}</h3><footer><strong>{money(p.price)}</strong><Button variant="ghost" onClick={()=>add(p.id)}>Ajouter <Plus size={14}/></Button></footer></div></article>)}</div>
    </section>
    <section id="histoire" className="story"><div className="story-mark"><BrandLogo className="story-logo"/></div><div><p className="eyebrow">Notre maison</p><h2>Une <em>signature</em>,<br/>pas un simple flacon.</h2><p>KEUR YAYE — « la maison de Yaye » — est née du désir d&apos;offrir une parfumerie fidèle aux goûts sénégalais, choisie avec la même exigence qu&apos;un bijou de famille.</p><div className="story-facts"><span><b>Dakar</b>Maison d&apos;origine</span><span><b>Sénégal</b>Livraison nationale</span></div></div></section>
    <footer className="site-footer"><div className="footer-brand"><BrandLogo className="footer-logo"/><p>KEUR <em>YAYE</em></p></div><p>Oud, eaux de parfum et essences de caractère.<br/>Livraison à Dakar et partout au Sénégal.</p><div><a href="tel:+221780136079">+221 78 013 60 79</a><a href="https://wa.me/221780136079">WhatsApp</a><button onClick={()=>setAdminOpen(true)}>Gérer la boutique</button></div><small>© 2026 KEUR YAYE · Dakar, Sénégal</small></footer>
    <Sheet open={cartOpen} onOpenChange={setCartOpen}><SheetContent className="cart-sheet" onTouchStart={e=>{cartTouchStart.current=e.touches[0].clientX}} onTouchEnd={e=>{if(e.changedTouches[0].clientX-cartTouchStart.current > 55){setCartOpen(false);window.location.hash='top'}}}>
      <SheetHeader><SheetTitle>Votre panier</SheetTitle><SheetDescription>{count?`${count} article${count>1?'s':''} sélectionné${count>1?'s':''}`:'Votre sélection est vide'}</SheetDescription></SheetHeader>
      <div className="cart-list">{items.length===0?<div className="empty"><ShoppingBag/><p>Votre panier est vide.</p><button onClick={()=>setCartOpen(false)}>Découvrir les parfums</button></div>:items.map(item=><div className="cart-line" key={item.id}><div className="cart-thumb"><Bottle tone={item.tone}/></div><div><h4>{item.name}</h4><p>{money(item.price)}</p><div className="quantity"><Button size="icon-xs" variant="outline" onClick={()=>qty(item.id,-1)} aria-label="Diminuer"><Minus/></Button><span>{item.qty}</span><Button size="icon-xs" variant="outline" onClick={()=>qty(item.id,1)} aria-label="Augmenter"><Plus/></Button></div></div><Button className="remove" variant="ghost" size="icon-sm" onClick={()=>setCart(c=>{const n={...c};delete n[item.id];return n})} aria-label={`Retirer ${item.name}`}><Trash2/></Button></div>)}</div>
      <div className="cart-total"><div><span>Total</span><strong>{money(total)}</strong></div><Button disabled={!items.length} onClick={()=>{setCartOpen(false);setCheckoutOpen(true);setConfirmed(false)}}>Passer la commande</Button><a className={items.length?'':'disabled'} href={items.length?whatsapp:undefined}>Ou commander par WhatsApp</a></div>
    </SheetContent></Sheet>

    <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}><DialogContent className="checkout-modal"><DialogHeader><DialogTitle>Finaliser la commande</DialogTitle><DialogDescription>Nous vous contactons pour confirmer la livraison.</DialogDescription></DialogHeader>{confirmed?<div className="success"><span><Check/></span><h3>Commande reçue, merci !</h3><p>KEUR YAYE vous contactera au {phone}.</p><Button onClick={()=>{setCheckoutOpen(false);setName('');setPhone('')}}>Fermer</Button></div>:<div className="checkout-form"><Input aria-label="Nom complet" placeholder="Nom complet" value={name} onChange={e=>setName(e.target.value)}/><Input aria-label="Numéro de téléphone" type="tel" placeholder="Numéro de téléphone" value={phone} onChange={e=>setPhone(e.target.value)}/><div><span>Total</span><strong>{money(total)}</strong></div><Button disabled={busy||!name.trim()||!phone.trim()} onClick={submitOrder}>{busy?'Envoi…':'Confirmer la commande'}</Button></div>}</DialogContent></Dialog>

    <Dialog open={adminOpen} onOpenChange={setAdminOpen}><DialogContent className="admin-modal"><DialogHeader><DialogTitle>Espace boutique</DialogTitle><DialogDescription>Catalogue et commandes KEUR YAYE.</DialogDescription></DialogHeader>{!adminOk?<div className="unlock"><LockKeyhole/><p>Entrez votre mot de passe de gestion.</p><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')unlock()}} placeholder="Mot de passe"/><Button onClick={unlock}>Entrer</Button>{adminError&&<span role="alert">{adminError}</span>}</div>:<div className="admin-workspace"><div className="admin-tabs"><button className={tab==='products'?'active':''} onClick={()=>setTab('products')}>Produits</button><button className={tab==='orders'?'active':''} onClick={()=>setTab('orders')}>Commandes {orders.filter(o=>o.status==='nouvelle').length>0&&`(${orders.filter(o=>o.status==='nouvelle').length})`}</button></div>
      {tab==='products'?<><form className="product-form" onSubmit={addProduct}><Input required placeholder="Nom du produit" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><Input required type="number" min="1" placeholder="Prix (FCFA)" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/><NativeSelect value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.slice(1).map(([key,label])=><NativeSelectOption value={key} key={key}>{label}</NativeSelectOption>)}</NativeSelect><Input placeholder="Description courte" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/><Button type="submit">Ajouter le produit</Button></form>{adminError&&<p className="upload-error" role="alert">{adminError}</p>}<div className="admin-list">{products.map(p=><div key={p.id}><span><b>{p.name}</b><small>{money(p.price)} · {categoryName(p.category)}</small></span><label className={`photo-upload ${uploading===p.id?'is-uploading':''}`}><input disabled={uploading!==null} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)uploadImage(p.id,file);e.currentTarget.value='' }}/><span>{p.hasImage?<ImageIcon/>:<Upload/>}{uploading===p.id?'Envoi…':p.hasImage?'Remplacer':'Ajouter photo'}</span></label><Button variant="ghost" size="icon-sm" onClick={()=>removeProduct(p.id)} aria-label={`Supprimer ${p.name}`}><Trash2/></Button></div>)}</div></>:<div className="orders-list">{orders.length===0?<p>Aucune commande pour l&apos;instant.</p>:orders.map(o=><article key={o.id}><header><span><b>{o.customerName}</b><a href={`tel:${o.phone}`}>{o.phone}</a></span><i className={o.status}>{o.status}</i></header><ul>{o.items.map((item,index)=><li key={index}>{item.name} × {item.qty}<b>{money(item.price*item.qty)}</b></li>)}</ul><footer><strong>{money(o.total)}</strong>{o.status==='nouvelle'&&<Button variant="outline" onClick={()=>mark(o.id)}>Marquer traitée</Button>}</footer></article>)}</div>}
    </div>}</DialogContent></Dialog>
  </main>
}
