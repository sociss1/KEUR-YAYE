import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }), name: text('name').notNull(),
  price: integer('price').notNull(), category: text('category').notNull(), note: text('note').notNull(),
  tone: text('tone').notNull().default('gold'), featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
});
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }), customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(), items: text('items').notNull(), total: integer('total').notNull(),
  status: text('status').notNull().default('nouvelle'), createdAt: text('created_at').notNull(),
}, table => [index('idx_orders_status').on(table.status)]);
