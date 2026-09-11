declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ASSETS: R2Bucket;
    ADMIN_PASSWORD_HASH?: string;
  }
}
