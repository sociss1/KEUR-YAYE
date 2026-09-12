import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const image=await env.DB.prepare('SELECT object_key AS objectKey, content_type AS contentType FROM product_images WHERE product_id=?').bind(Number(id)).first<{objectKey:string;contentType:string}>();
  if(!image)return new NextResponse(null,{status:404});
  const object=await env.PRODUCT_IMAGES.get(image.objectKey);
  if(!object)return new NextResponse(null,{status:404});
  return new NextResponse(object.body,{headers:{'content-type':image.contentType,'cache-control':'public, max-age=3600','etag':object.httpEtag}});
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!(await isAdmin(request)))return NextResponse.json({error:'Accès refusé'},{status:401});
  const {id}=await params,productId=Number(id),form=await request.formData(),file=form.get('image');
  if(!(file instanceof File))return NextResponse.json({error:'Photo manquante'},{status:400});
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return NextResponse.json({error:'Format accepté : JPG, PNG ou WebP'},{status:400});
  if(file.size>6*1024*1024)return NextResponse.json({error:'La photo dépasse 6 Mo'},{status:400});
  const product=await env.DB.prepare('SELECT id FROM products WHERE id=?').bind(productId).first();
  if(!product)return NextResponse.json({error:'Produit introuvable'},{status:404});
  const previous=await env.DB.prepare('SELECT object_key AS objectKey FROM product_images WHERE product_id=?').bind(productId).first<{objectKey:string}>();
  const key=`products/${productId}/${crypto.randomUUID()}`;
  await env.PRODUCT_IMAGES.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
  await env.DB.prepare('INSERT INTO product_images (product_id,object_key,content_type,updated_at) VALUES (?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET object_key=excluded.object_key,content_type=excluded.content_type,updated_at=excluded.updated_at').bind(productId,key,file.type,new Date().toISOString()).run();
  if(previous?.objectKey&&previous.objectKey!==key)await env.PRODUCT_IMAGES.delete(previous.objectKey);
  return NextResponse.json({ok:true});
}
