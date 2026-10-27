CREATE TABLE `clicks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` text NOT NULL,
	`clicked_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `daily_prices` (
	`product_id` text NOT NULL,
	`day` text NOT NULL,
	`price` integer NOT NULL,
	`observed_at` text NOT NULL,
	`source` text NOT NULL,
	PRIMARY KEY(`product_id`, `day`, `source`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "price_positive" CHECK("daily_prices"."price" > 0)
);
--> statement-breakpoint
CREATE INDEX `prices_day_idx` ON `daily_prices` (`day`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`retailer` text NOT NULL,
	`retailer_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`url` text NOT NULL,
	`mrp` integer NOT NULL,
	`demo` integer DEFAULT true NOT NULL,
	CONSTRAINT "mrp_positive" CHECK("products"."mrp" > 0)
);
