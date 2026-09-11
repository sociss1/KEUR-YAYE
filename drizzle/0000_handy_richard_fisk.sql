CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`items` text NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'nouvelle' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`category` text NOT NULL,
	`note` text NOT NULL,
	`tone` text DEFAULT 'gold' NOT NULL,
	`featured` integer DEFAULT false NOT NULL
);
