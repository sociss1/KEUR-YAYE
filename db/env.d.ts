declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    PRODUCT_IMAGES: R2Bucket;
    ADMIN_PASSWORD_HASH?: string;
  }
}
