import { statSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');

export async function resolve(specifier, context, nextResolve) {
	if (specifier === '$env/dynamic/private') {
		return {
			shortCircuit: true,
			url: 'data:text/javascript,export const env = process.env;'
		};
	}

	if (specifier.startsWith('$lib/')) {
		return resolveFile(resolvePath(root, 'src/lib', specifier.slice('$lib/'.length)));
	}

	if (isRelativeSpecifier(specifier) && context.parentURL?.startsWith('file:')) {
		try {
			return await nextResolve(specifier, context);
		} catch (error) {
			if (!isModuleNotFound(error)) throw error;
			const parentPath = dirname(fileURLToPath(context.parentURL));
			return resolveFile(resolvePath(parentPath, specifier));
		}
	}

	return nextResolve(specifier, context);
}

function resolveFile(basePath) {
	for (const candidate of [
		basePath,
		`${basePath}.ts`,
		`${basePath}.js`,
		resolvePath(basePath, 'index.ts'),
		resolvePath(basePath, 'index.js')
	]) {
		if (isFile(candidate)) {
			return {
				shortCircuit: true,
				url: pathToFileURL(candidate).href
			};
		}
	}

	throw new Error(`Cannot resolve ${basePath}`);
}

function isFile(path) {
	try {
		return statSync(path).isFile();
	} catch {
		return false;
	}
}

function isRelativeSpecifier(specifier) {
	return specifier.startsWith('./') || specifier.startsWith('../');
}

function isModuleNotFound(error) {
	return error && typeof error === 'object' && 'code' in error && error.code === 'ERR_MODULE_NOT_FOUND';
}
