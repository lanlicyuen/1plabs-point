CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text,
	`action` text NOT NULL,
	`detail` text,
	`actor` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`priority` text DEFAULT 'normal',
	`status` text DEFAULT 'pending',
	`assignee` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	`updated_by` text,
	`pinned` integer DEFAULT false
);
