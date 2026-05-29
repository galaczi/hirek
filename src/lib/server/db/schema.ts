import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex
} from 'drizzle-orm/pg-core';

export const sources = pgTable(
	'sources',
	{
		id: serial('id').primaryKey(),
		slug: text('slug').notNull(),
		name: text('name').notNull(),
		domain: text('domain').notNull(),
		approvalStatus: text('approval_status').notNull().default('approved'),
		status: text('status').notNull().default('ingesting'),
		statusNote: text('status_note'),
		partnerPackage: text('partner_package').notNull().default('free'),
		partnerStatus: text('partner_status').notNull().default('none'),
		trafficTarget: integer('traffic_target').notNull().default(0),
		utmSource: text('utm_source').notNull().default('hirek.hu'),
		utmMedium: text('utm_medium').notNull().default('referral'),
		utmCampaign: text('utm_campaign').notNull().default('hirek_stream'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		slugIdx: uniqueIndex('sources_slug_idx').on(table.slug),
		domainIdx: index('sources_domain_idx').on(table.domain),
		approvalStatusIdx: index('sources_approval_status_idx').on(table.approvalStatus),
		statusIdx: index('sources_status_idx').on(table.status),
		partnerStatusIdx: index('sources_partner_status_idx').on(table.partnerStatus)
	})
);

export const user = pgTable(
	'user',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		email: text('email').notNull(),
		emailVerified: boolean('email_verified').notNull().default(false),
		image: text('image'),
		role: text('role').notNull().default('partner'),
		sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		emailIdx: uniqueIndex('user_email_idx').on(table.email),
		sourceIdx: index('user_source_idx').on(table.sourceId),
		roleIdx: index('user_role_idx').on(table.role)
	})
);

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		token: text('token').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => ({
		tokenIdx: uniqueIndex('session_token_idx').on(table.token),
		userIdx: index('session_user_idx').on(table.userId)
	})
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		userIdx: index('account_user_idx').on(table.userId)
	})
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		identifierIdx: index('verification_identifier_idx').on(table.identifier)
	})
);

export const categories = pgTable(
	'categories',
	{
		id: serial('id').primaryKey(),
		slug: text('slug').notNull(),
		name: text('name').notNull()
	},
	(table) => ({
		slugIdx: uniqueIndex('categories_slug_idx').on(table.slug)
	})
);

export const sourceFeeds = pgTable(
	'source_feeds',
	{
		id: serial('id').primaryKey(),
		sourceId: integer('source_id')
			.notNull()
			.references(() => sources.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
		feedUrl: text('feed_url').notNull(),
		status: text('status').notNull().default('active'),
		lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
		lastError: text('last_error'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		feedUrlIdx: uniqueIndex('source_feeds_feed_url_idx').on(table.feedUrl),
		sourceIdx: index('source_feeds_source_idx').on(table.sourceId),
		statusIdx: index('source_feeds_status_idx').on(table.status)
	})
);

export const sourceCategoryRules = pgTable(
	'source_category_rules',
	{
		id: serial('id').primaryKey(),
		sourceId: integer('source_id')
			.notNull()
			.references(() => sources.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' }),
		urlPattern: text('url_pattern').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		sourceIdx: index('source_category_rules_source_idx').on(table.sourceId),
		categoryIdx: index('source_category_rules_category_idx').on(table.categoryId),
		sourcePatternIdx: uniqueIndex('source_category_rules_source_pattern_idx').on(
			table.sourceId,
			table.urlPattern
		)
	})
);

export const ingestionJobs = pgTable(
	'ingestion_jobs',
	{
		id: serial('id').primaryKey(),
		type: text('type').notNull(),
		status: text('status').notNull().default('queued'),
		payload: text('payload').notNull().default('{}'),
		attempts: integer('attempts').notNull().default(0),
		runAfter: timestamp('run_after', { withTimezone: true }).notNull().defaultNow(),
		lockedAt: timestamp('locked_at', { withTimezone: true }),
		finishedAt: timestamp('finished_at', { withTimezone: true }),
		lastError: text('last_error'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		statusRunAfterIdx: index('ingestion_jobs_status_run_after_idx').on(table.status, table.runAfter),
		typeIdx: index('ingestion_jobs_type_idx').on(table.type)
	})
);

export const articles = pgTable(
	'articles',
	{
		id: serial('id').primaryKey(),
		sourceId: integer('source_id')
			.notNull()
			.references(() => sources.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		excerpt: text('excerpt'),
		canonicalUrl: text('canonical_url').notNull(),
		urlHost: text('url_host').notNull(),
		publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
		clickScore: integer('click_score').notNull().default(0),
		active: boolean('active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		canonicalUrlIdx: uniqueIndex('articles_canonical_url_idx').on(table.canonicalUrl),
		publishedAtIdx: index('articles_published_at_idx').on(table.publishedAt),
		sourceIdx: index('articles_source_idx').on(table.sourceId),
		activeIdx: index('articles_active_idx').on(table.active)
	})
);

export const articleCategories = pgTable(
	'article_categories',
	{
		articleId: integer('article_id')
			.notNull()
			.references(() => articles.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' })
	},
	(table) => ({
		articleCategoryIdx: uniqueIndex('article_categories_article_category_idx').on(
			table.articleId,
			table.categoryId
		),
		categoryIdx: index('article_categories_category_idx').on(table.categoryId)
	})
);

export const articleCategoryOverrides = pgTable(
	'article_category_overrides',
	{
		articleId: integer('article_id')
			.primaryKey()
			.references(() => articles.id, { onDelete: 'cascade' }),
		sourceId: integer('source_id')
			.notNull()
			.references(() => sources.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' }),
		note: text('note'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		sourceIdx: index('article_category_overrides_source_idx').on(table.sourceId),
		categoryIdx: index('article_category_overrides_category_idx').on(table.categoryId)
	})
);

export const clickEvents = pgTable(
	'click_events',
	{
		id: serial('id').primaryKey(),
		articleId: integer('article_id')
			.notNull()
			.references(() => articles.id, { onDelete: 'cascade' }),
		sourceId: integer('source_id')
			.notNull()
			.references(() => sources.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
		referrer: text('referrer'),
		userAgent: text('user_agent'),
		ipHash: text('ip_hash'),
		utmCampaign: text('utm_campaign').notNull().default('hirek_stream'),
		utmContent: text('utm_content'),
		isBot: boolean('is_bot').notNull().default(false),
		botName: text('bot_name'),
		isUnique: boolean('is_unique').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		articleIdx: index('click_events_article_idx').on(table.articleId),
		sourceIdx: index('click_events_source_idx').on(table.sourceId),
		categoryIdx: index('click_events_category_idx').on(table.categoryId),
		campaignIdx: index('click_events_campaign_idx').on(table.utmCampaign),
		botIdx: index('click_events_bot_idx').on(table.isBot),
		uniqueIdx: index('click_events_unique_idx').on(table.isUnique),
		createdAtIdx: index('click_events_created_at_idx').on(table.createdAt)
	})
);

export const impressionEvents = pgTable(
	'impression_events',
	{
		id: serial('id').primaryKey(),
		articleId: integer('article_id')
			.notNull()
			.references(() => articles.id, { onDelete: 'cascade' }),
		sourceId: integer('source_id')
			.notNull()
			.references(() => sources.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
		pagePath: text('page_path'),
		referrer: text('referrer'),
		userAgent: text('user_agent'),
		ipHash: text('ip_hash'),
		isBot: boolean('is_bot').notNull().default(false),
		botName: text('bot_name'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		articleIdx: index('impression_events_article_idx').on(table.articleId),
		sourceIdx: index('impression_events_source_idx').on(table.sourceId),
		categoryIdx: index('impression_events_category_idx').on(table.categoryId),
		createdAtIdx: index('impression_events_created_at_idx').on(table.createdAt),
		botIdx: index('impression_events_bot_idx').on(table.isBot)
	})
);
