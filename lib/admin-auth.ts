import { env } from 'cloudflare:workers';

const COOKIE_NAME='ky_admin_session';

async function sha256(value:string){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

export async function validPassword(password:string){
  return Boolean(env.ADMIN_PASSWORD_HASH&&password&&await sha256(password)===env.ADMIN_PASSWORD_HASH);
}

async function sessionToken(){return sha256(`${env.ADMIN_PASSWORD_HASH}:keur-yaye-admin-session:v1`)}

export async function isAdmin(request:Request){
  const password=request.headers.get('x-admin-password');
  if(password&&await validPassword(password))return true;
  const cookie=request.headers.get('cookie')||'';
  const token=cookie.split(';').map(value=>value.trim()).find(value=>value.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length+1);
  return Boolean(token&&token===await sessionToken());
}

export async function adminSessionCookie(){
  return `${COOKIE_NAME}=${await sessionToken()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`;
}
