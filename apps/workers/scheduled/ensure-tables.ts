import postgres from 'postgres'

type HyperdriveBinding = {
	connectionString: string
}

/**
 * Minimal bootstrap for Neon via Hyperdrive.
 * Creates tables if they don't exist so scheduled sync can populate incrementally.
 */
export default async function ensureTables(hyperdrive: HyperdriveBinding) {
	// eslint-disable-next-line no-console
	console.log('[ensureTables] Starting...')

	const sql = postgres(hyperdrive.connectionString, {
		fetch_types: false,
		max: 1,
	})

	// eslint-disable-next-line no-console
	console.log('[ensureTables] Postgres connection created')

	// Ensure schema exists
	// eslint-disable-next-line no-console
	console.log('[ensureTables] Creating schema...')
	await sql`CREATE SCHEMA IF NOT EXISTS tolo`
	// eslint-disable-next-line no-console
	console.log('[ensureTables] Schema created')

	const statements = [
		`CREATE TABLE IF NOT EXISTS tolo.client_groups (
      id INTEGER PRIMARY KEY,
      name TEXT
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.customers (
      id INTEGER PRIMARY KEY,
      phone TEXT,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      patronymic TEXT,
      birthday TEXT,
      bonus INTEGER,
      ewallet INTEGER,
      total_payed_sum INTEGER,
      city TEXT,
      country TEXT,
      comment TEXT,
      loyalty_type TEXT,
      client_group_id INTEGER REFERENCES client_groups(id),
      client_group_name TEXT,
      created_at TEXT,
      updated_at TEXT
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.locations (
      id INTEGER PRIMARY KEY,
      name TEXT,
      tablet_id INTEGER,
      address TEXT,
      city TEXT,
      country TEXT,
      service_phone TEXT
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.menu_categories (
      id INTEGER PRIMARY KEY,
      name TEXT,
      color TEXT,
      parent_id INTEGER,
      sort_order INTEGER,
      hidden BOOLEAN,
      tag TEXT,
      tax_id INTEGER,
      visible_raw TEXT
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      type INTEGER,
      menu_category_id INTEGER REFERENCES menu_categories(id),
      tax_id INTEGER,
      unit TEXT,
      barcode TEXT,
      description TEXT,
      production_note TEXT,
      small_description TEXT,
      price_cents INTEGER,
      color TEXT,
      hidden BOOLEAN,
      no_discount BOOLEAN,
      master_id INTEGER,
      weight_flag BOOLEAN,
      out_of_stock INTEGER,
      volume INTEGER,
      caffeine INTEGER,
      intensity INTEGER,
      workshop TEXT,
      recipe TEXT,
      photo TEXT,
      photo_origin TEXT,
      different_spot_raw TEXT,
      spots_raw TEXT,
      profit_raw TEXT,
      sources_raw TEXT
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.product_modifier_groups (
      id INTEGER PRIMARY KEY,
      name TEXT,
      num_min INTEGER,
      num_max INTEGER,
      type INTEGER,
      is_deleted BOOLEAN,
      product_id INTEGER REFERENCES products(id)
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.product_modifiers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price_diff INTEGER,
      group_id INTEGER REFERENCES product_modifier_groups(id),
      product_id INTEGER REFERENCES products(id),
      is_deleted BOOLEAN
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.ingredients (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT,
      weight INTEGER,
      cost INTEGER,
      losses_raw TEXT
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.dishes (
      id INTEGER PRIMARY KEY,
      product_id INTEGER REFERENCES products(id),
      net_weight INTEGER,
      cooking_time TEXT,
      workshop TEXT
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.product_ingredients (
      product_id INTEGER NOT NULL REFERENCES products(id),
      ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
      quantity INTEGER,
      PRIMARY KEY (product_id, ingredient_id)
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.transactions (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id),
      location_id INTEGER REFERENCES locations(id),
      table_id INTEGER,
      user_id INTEGER,
      pay_type INTEGER,
      status INTEGER NOT NULL,
      processing_status INTEGER NOT NULL,
      type INTEGER,
      bonus_used INTEGER,
      discount INTEGER,
      payed_bonus INTEGER,
      payed_cash INTEGER,
      payed_card INTEGER,
      payed_cert INTEGER,
      payed_third_party INTEGER,
      payed_sum INTEGER NOT NULL,
      sum INTEGER,
      tip_sum INTEGER,
      round_sum INTEGER,
      service_mode INTEGER,
      comment TEXT,
      reason INTEGER,
      date_start TEXT,
      date_created TEXT NOT NULL,
      date_close TEXT,
      synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.order_lines (
      transaction_id INTEGER NOT NULL REFERENCES transactions(id),
      line_index INTEGER NOT NULL,
      product_id INTEGER REFERENCES products(id),
      category_id INTEGER,
      quantity INTEGER,
      product_sum INTEGER,
      product_name TEXT,
      modifiers_json TEXT,
      PRIMARY KEY (transaction_id, line_index)
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.transaction_product_modifiers (
      transaction_id INTEGER NOT NULL REFERENCES transactions(id),
      line_index INTEGER NOT NULL,
      modifier_id INTEGER NOT NULL REFERENCES product_modifiers(id),
      group_name TEXT,
      name TEXT,
      amount INTEGER,
      PRIMARY KEY (transaction_id, line_index, modifier_id)
    );`,
		`CREATE TABLE IF NOT EXISTS tolo.sync_state (
      id TEXT PRIMARY KEY,
      cursor TEXT,
      last_transaction_date TEXT,
      last_transaction_id INTEGER,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
	]

	// eslint-disable-next-line no-console
	console.log(
		`[ensureTables] Running ${statements.length} CREATE TABLE statements...`,
	)

	for (let index = 0; index < statements.length; index++) {
		// eslint-disable-next-line no-console
		console.log(
			`[ensureTables] Creating table ${index + 1}/${statements.length}...`,
		)
		await sql.unsafe(statements[index])
	}

	// Drop foreign key constraints that cause issues with incremental sync
	// eslint-disable-next-line no-console
	console.log('[ensureTables] Dropping foreign key constraints...')
	const dropConstraints = [
		'ALTER TABLE tolo.customers DROP CONSTRAINT IF EXISTS customers_client_group_id_fkey',
		'ALTER TABLE tolo.products DROP CONSTRAINT IF EXISTS products_menu_category_id_fkey',
		'ALTER TABLE tolo.transactions DROP CONSTRAINT IF EXISTS transactions_customer_id_fkey',
		'ALTER TABLE tolo.transactions DROP CONSTRAINT IF EXISTS transactions_location_id_fkey',
		'ALTER TABLE tolo.order_lines DROP CONSTRAINT IF EXISTS order_lines_transaction_id_fkey',
		'ALTER TABLE tolo.order_lines DROP CONSTRAINT IF EXISTS order_lines_product_id_fkey',
		'ALTER TABLE tolo.transaction_product_modifiers DROP CONSTRAINT IF EXISTS transaction_product_modifiers_transaction_id_fkey',
		'ALTER TABLE tolo.transaction_product_modifiers DROP CONSTRAINT IF EXISTS transaction_product_modifiers_modifier_id_fkey',
	]
	for (const statement of dropConstraints) {
		await sql.unsafe(statement)
	}
	// eslint-disable-next-line no-console
	console.log('[ensureTables] Foreign key constraints dropped')

	// eslint-disable-next-line no-console
	console.log('[ensureTables] All tables created, closing connection...')
	await sql.end()
	// eslint-disable-next-line no-console
	console.log('[ensureTables] Done!')
}
