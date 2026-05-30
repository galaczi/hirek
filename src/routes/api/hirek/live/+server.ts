import type { RequestHandler } from './$types';
import type { Article } from '$lib/home/data';
import { matchesTimeFilter } from '$lib/home/utils';
import { createLiveArticleListener } from '$lib/server/live/articles';

const encoder = new TextEncoder();

export const GET: RequestHandler = async ({ request, url }) => {
	let closeListener: (() => Promise<void>) | undefined;
	let heartbeat: ReturnType<typeof setInterval> | undefined;
	let closed = false;
	const filters = {
		category: cleanFilter(url.searchParams.get('category')),
		source: cleanFilter(url.searchParams.get('source')),
		time: url.searchParams.get('time') ?? 'all',
		q: url.searchParams.get('q')?.trim().toLocaleLowerCase('hu-HU') ?? ''
	};

	const cleanup = (controller?: ReadableStreamDefaultController<Uint8Array>) => {
		if (closed) return;
		closed = true;
		if (heartbeat) clearInterval(heartbeat);
		void closeListener?.();
		try {
			controller?.close();
		} catch {
			// The stream may already be closed by the client disconnect path.
		}
	};

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const send = (event: string, data: unknown) => {
				controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
			};

			send('ready', { ok: true });
			heartbeat = setInterval(() => {
				controller.enqueue(encoder.encode(': heartbeat\n\n'));
			}, 25_000);

			const listener = await createLiveArticleListener((article) => {
				if (!matchesLiveFilters(article, filters)) return;
				send('article', article);
			});
			closeListener = listener.close;

			request.signal.addEventListener('abort', () => {
				cleanup(controller);
			});
		},
		cancel() {
			cleanup();
		}
	});

	return new Response(stream, {
		headers: {
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive',
			'content-type': 'text/event-stream; charset=utf-8',
			'x-accel-buffering': 'no'
		}
	});
};

function cleanFilter(value: string | null) {
	const clean = value?.trim();
	return clean && clean !== 'all' ? clean : undefined;
}

function matchesLiveFilters(
	article: Article,
	filters: { category?: string; source?: string; time: string; q: string }
) {
	if (filters.category && !article.categorySlugs.includes(filters.category)) return false;
	if (filters.source && article.source !== filters.source) return false;
	if (!matchesTimeFilter(article, filters.time)) return false;
	if (filters.q && !articleMatchesQuery(article, filters.q)) return false;
	return true;
}

function articleMatchesQuery(article: Article, query: string) {
	return [
		article.title,
		article.excerpt ?? '',
		article.sourceName,
		article.categoryName,
		...article.categorySlugs
	]
		.join(' ')
		.toLocaleLowerCase('hu-HU')
		.includes(query);
}
