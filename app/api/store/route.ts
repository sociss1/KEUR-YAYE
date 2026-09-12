import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { adminSessionCookie, isAdmin, validPassword } from '@/lib/admin-auth';

const publicHeaders = { 'Access-Control-Allow-Origin': 'https://sociss1.github.io', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

const seeds = [
  ['Oud El Malick',17000,'parfum-corps','Oud puissant et boisé, sillage affirmé.','amber',1],
  ['Rose de Yaye',15000,'parfum-corps','Rose épanouie relevée de notes ambrées.','rose',0],
  ['Nuit Dorée',19000,'parfum-corps','Vanille, musc et une pointe de safran.','gold',0],
  ['Fleur de Thiès',14000,'parfum-corps','Fleurs blanches, fraîches et lumineuses.','rose',0],
  ['Sillage Royal',21000,'parfum-corps','Cuir et épices pour une présence marquée.','amber',0],
  ['Brume Ndar',7500,'deodorant','Une fraîcheur propre aux notes d’agrumes et de musc.','mint',0],
  ['Keur Santal',12500,'parfum-chambre','Santal crémeux et ambre doux pour parfumer la maison.','violet',0],
  ['Huile Mousso',9000,'huile','Huile parfumée concentrée, lumineuse et enveloppante.','rose',0],
  ['Coffret Teranga',29000,'coffret','Trois signatures essentielles réunies dans un coffret cadeau.','gold',0],
] as const;

async function ready() {
  const db = env.DB;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price INTEGER NOT NULL, category TEXT NOT NULL, note TEXT NOT NULL, tone TEXT NOT NULL DEFAULT 'gold', featured INTEGER NOT NULL DEFAULT 0)"),
    db.prepare("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, phone TEXT NOT NULL, items TEXT NOT NULL, total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'nouvelle', created_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS product_images (product_id INTEGER PRIMARY KEY, object_key TEXT NOT NULL, content_type TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_orders_open_status ON orders(status) WHERE status != 'traitée'"),
    db.prepare('PRAGMA optimize'),
  ]);
  await db.prepare("UPDATE products SET category='parfum-corps' WHERE category IN ('homme','femme','unisexe')").run();
  await db.batch(seeds.map(p => db.prepare('INSERT INTO products (name,price,category,note,tone,featured) SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM products WHERE name=?)').bind(...p,p[0])));
  return db;
}

export async function GET(request: Request) {
  const db = await ready();
  if (new URL(request.url).searchParams.get('orders') === '1') {
    if (!(await isAdmin(request))) return NextResponse.json({ error: 'Accès refusé' }, { status: 401 });
    const result = await db.prepare('SELECT id, customer_name AS customerName, phone, items, total, status, created_at AS createdAt FROM orders ORDER BY id DESC').all();
    return NextResponse.json(result.results.map((o:any)=>({...o,items:JSON.parse(o.items)})));
  }
  const result = await db.prepare('SELECT p.id,p.name,p.price,p.category,p.note,p.tone,p.featured,CASE WHEN i.product_id IS NULL THEN 0 ELSE 1 END AS hasImage,i.updated_at AS imageVersion FROM products p LEFT JOIN product_images i ON i.product_id=p.id ORDER BY p.id').all();
  return NextResponse.json(result.results.map((p:any)=>({...p,featured:Boolean(p.featured)})), { headers: publicHeaders });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: publicHeaders }); }

export async function POST(request: Request) {
  const db = await ready();
  const body = await request.json() as any;
  if (body.action === 'login') {
    if (!(await validPassword(String(body.password||'')))) return NextResponse.json({error:'Mot de passe incorrect'},{status:401});
    return NextResponse.json({ok:true},{headers:{'set-cookie':await adminSessionCookie()}});
  }
  if (body.action === 'order') {
    if (!body.customerName?.trim() || !body.phone?.trim() || !Array.isArray(body.items) || !body.items.length) return NextResponse.json({error:'Commande incomplète'}, {status:400});
    const items = body.items.map((i:any)=>({name:String(i.name),price:Number(i.price),qty:Math.max(1,Number(i.qty))}));
    const total = items.reduce((sum:number,item:any)=>sum + item.price*item.qty,0);
    const result = await db.prepare('INSERT INTO orders (customer_name,phone,items,total,status,created_at) VALUES (?,?,?,?,?,?)').bind(body.customerName.trim(),body.phone.trim(),JSON.stringify(items),total,'nouvelle',new Date().toISOString()).run();
    return NextResponse.json({ id: result.meta.last_row_id, total }, { status: 201 });
  }
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Accès refusé' }, { status: 401 });
  if (body.action === 'product') {
    if (!body.name?.trim() || !Number(body.price)) return NextResponse.json({error:'Produit incomplet'},{status:400});
    await db.prepare('INSERT INTO products (name,price,category,note,tone,featured) VALUES (?,?,?,?,?,0)').bind(body.name.trim(),Number(body.price),body.category,body.note.trim() || 'Une nouvelle signature KEUR YAYE.',body.tone || 'gold').run();
    return NextResponse.json({ok:true},{status:201});
  }
  if (body.action === 'status') {
    await db.prepare('UPDATE orders SET status=? WHERE id=?').bind('traitée',Number(body.id)).run();
    return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:'Action inconnue'},{status:400});
}

export async function DELETE(request: Request) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Accès refusé' }, { status: 401 });
  const db = await ready();
  const id = Number(new URL(request.url).searchParams.get('id'));
  const image = await db.prepare('SELECT object_key AS objectKey FROM product_images WHERE product_id=?').bind(id).first<{objectKey:string}>();
  if (image?.objectKey) await env.PRODUCT_IMAGES.delete(image.objectKey);
  await db.batch([
    db.prepare('DELETE FROM product_images WHERE product_id=?').bind(id),
    db.prepare('DELETE FROM products WHERE id=?').bind(id),
  ]);
  return NextResponse.json({ok:true});
}
