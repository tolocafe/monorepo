CREATE TABLE "tolo"."client_groups" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text
);
--> statement-breakpoint
CREATE TABLE "tolo"."customers" (
	"birthday" text,
	"bonus" integer,
	"city" text,
	"client_group_id" integer,
	"client_group_name" text,
	"comment" text,
	"country" text,
	"created_at" text,
	"email" text,
	"ewallet" integer,
	"first_name" text,
	"id" integer PRIMARY KEY NOT NULL,
	"last_name" text,
	"loyalty_type" text,
	"patronymic" text,
	"phone" text,
	"total_payed_sum" integer,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "tolo"."dishes" (
	"cooking_time" text,
	"id" integer PRIMARY KEY NOT NULL,
	"net_weight" integer,
	"product_id" integer,
	"workshop" text
);
--> statement-breakpoint
CREATE TABLE "tolo"."ingredients" (
	"cost" integer,
	"id" integer PRIMARY KEY NOT NULL,
	"losses_raw" text,
	"name" text NOT NULL,
	"unit" text,
	"weight" integer
);
--> statement-breakpoint
CREATE TABLE "tolo"."locations" (
	"address" text,
	"city" text,
	"country" text,
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"service_phone" text,
	"tablet_id" integer
);
--> statement-breakpoint
CREATE TABLE "tolo"."menu_categories" (
	"color" text,
	"hidden" boolean,
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"parent_id" integer,
	"sort_order" integer,
	"tag" text,
	"tax_id" integer,
	"visible_raw" text
);
--> statement-breakpoint
CREATE TABLE "tolo"."order_lines" (
	"category_id" integer,
	"line_index" integer NOT NULL,
	"modifiers_json" text,
	"product_id" integer,
	"product_name" text,
	"product_sum" integer,
	"quantity" integer,
	"transaction_id" integer NOT NULL,
	CONSTRAINT "order_lines_transaction_id_line_index_pk" PRIMARY KEY("transaction_id","line_index")
);
--> statement-breakpoint
CREATE TABLE "tolo"."product_ingredients" (
	"ingredient_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer,
	CONSTRAINT "product_ingredients_product_id_ingredient_id_pk" PRIMARY KEY("product_id","ingredient_id")
);
--> statement-breakpoint
CREATE TABLE "tolo"."product_modifier_groups" (
	"id" integer PRIMARY KEY NOT NULL,
	"is_deleted" boolean,
	"name" text,
	"num_max" integer,
	"num_min" integer,
	"product_id" integer,
	"type" integer
);
--> statement-breakpoint
CREATE TABLE "tolo"."product_modifiers" (
	"group_id" integer,
	"id" integer PRIMARY KEY NOT NULL,
	"is_deleted" boolean,
	"name" text NOT NULL,
	"price_diff" integer,
	"product_id" integer
);
--> statement-breakpoint
CREATE TABLE "tolo"."products" (
	"barcode" text,
	"caffeine" integer,
	"code" text,
	"color" text,
	"description" text,
	"different_spot_raw" text,
	"hidden" boolean,
	"id" integer PRIMARY KEY NOT NULL,
	"intensity" integer,
	"master_id" integer,
	"menu_category_id" integer,
	"name" text NOT NULL,
	"no_discount" boolean,
	"out_of_stock" integer,
	"photo" text,
	"photo_origin" text,
	"price_cents" integer,
	"production_note" text,
	"profit_raw" text,
	"recipe" text,
	"small_description" text,
	"sources_raw" text,
	"spots_raw" text,
	"tax_id" integer,
	"type" integer,
	"unit" text,
	"volume" integer,
	"weight_flag" boolean,
	"workshop" text
);
--> statement-breakpoint
CREATE TABLE "tolo"."sync_state" (
	"cursor" text,
	"id" text PRIMARY KEY NOT NULL,
	"last_transaction_date" text,
	"last_transaction_id" integer,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "tolo"."transaction_product_modifiers" (
	"amount" integer,
	"group_name" text,
	"line_index" integer NOT NULL,
	"modifier_id" integer NOT NULL,
	"name" text,
	"transaction_id" integer NOT NULL,
	CONSTRAINT "transaction_product_modifiers_transaction_id_line_index_modifier_id_pk" PRIMARY KEY("transaction_id","line_index","modifier_id")
);
--> statement-breakpoint
CREATE TABLE "tolo"."transactions" (
	"bonus_used" integer,
	"comment" text,
	"customer_id" integer,
	"date_close" text,
	"date_created" text NOT NULL,
	"date_start" text,
	"discount" integer,
	"id" integer PRIMARY KEY NOT NULL,
	"location_id" integer,
	"payed_bonus" integer,
	"payed_card" integer,
	"payed_cash" integer,
	"payed_cert" integer,
	"payed_sum" integer NOT NULL,
	"payed_third_party" integer,
	"pay_type" integer,
	"processing_status" integer NOT NULL,
	"reason" integer,
	"round_sum" integer,
	"service_mode" integer,
	"status" integer NOT NULL,
	"sum" integer,
	"synced_at" text DEFAULT CURRENT_TIMESTAMP,
	"table_id" integer,
	"tip_sum" integer,
	"type" integer,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP,
	"user_id" integer
);
