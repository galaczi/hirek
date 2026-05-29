DO $$
DECLARE
	invalid_domain_ids text;
	conflict record;
BEGIN
	SELECT string_agg(id::text, ', ' ORDER BY id)
	INTO invalid_domain_ids
	FROM (
		SELECT
			id,
			regexp_replace(
				lower(
					regexp_replace(
						regexp_replace(
							regexp_replace(
								regexp_replace(trim(domain), '^https?://', '', 'i'),
								'^www\.',
								'',
								'i'
							),
							'[/?#].*$',
							'',
							''
						),
						':\d+$',
						'',
						''
					)
				),
				'\.+$',
				'',
				''
			) AS normalized_domain
		FROM sources
	) normalized_sources
	WHERE normalized_domain = '';

	IF invalid_domain_ids IS NOT NULL THEN
		RAISE EXCEPTION 'Cannot normalize sources.domain because source ids [%] would end up with an empty canonical domain.', invalid_domain_ids;
	END IF;

	SELECT
		normalized_domain,
		string_agg(id::text, ', ' ORDER BY id) AS source_ids
	INTO conflict
	FROM (
		SELECT
			id,
			regexp_replace(
				lower(
					regexp_replace(
						regexp_replace(
							regexp_replace(
								regexp_replace(trim(domain), '^https?://', '', 'i'),
								'^www\.',
								'',
								'i'
							),
							'[/?#].*$',
							'',
							''
						),
						':\d+$',
						'',
						''
					)
				),
				'\.+$',
				'',
				''
			) AS normalized_domain
		FROM sources
	) normalized_sources
	GROUP BY normalized_domain
	HAVING count(*) > 1
	LIMIT 1;

	IF FOUND THEN
		RAISE EXCEPTION 'Cannot normalize sources.domain because canonical domain "%" would collide for source ids [%]. Resolve duplicates before applying migration.', conflict.normalized_domain, conflict.source_ids;
	END IF;
END $$;
--> statement-breakpoint
UPDATE sources
SET domain = regexp_replace(
	lower(
		regexp_replace(
			regexp_replace(
				regexp_replace(
					regexp_replace(trim(domain), '^https?://', '', 'i'),
					'^www\.',
					'',
					'i'
				),
				'[/?#].*$',
				'',
				''
			),
			':\d+$',
			'',
			''
		)
	),
	'\.+$',
	'',
	''
);
--> statement-breakpoint
DROP INDEX "sources_domain_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "sources_domain_idx" ON "sources" USING btree ("domain");
