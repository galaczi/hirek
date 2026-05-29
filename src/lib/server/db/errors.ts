type PostgresLikeError = {
	code?: string;
	constraint_name?: string;
};

export function isUniqueViolation(error: unknown, constraintName?: string) {
	if (!error || typeof error !== 'object') return false;

	const postgresError = error as PostgresLikeError;
	if (postgresError.code !== '23505') return false;
	if (!constraintName) return true;

	return postgresError.constraint_name === constraintName;
}
