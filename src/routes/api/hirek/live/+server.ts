import type { RequestHandler } from './$types';
import { createLiveArticleListener } from '$lib/server/live/articles';

const encoder = new TextEncoder();

export const GET: RequestHandler = async ({ request }) => {
	let closeListener: (() => Promise<void>) | undefined;
	let heartbeat: ReturnType<typeof setInterval> | undefined;
	let closed = false;

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
