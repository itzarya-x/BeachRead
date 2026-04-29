type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
  hint?: string | null;
};

const MISSING_TABLE_CODE = 'PGRST205';
const UNDEFINED_TABLE_CODE = '42P01'; // Raw Postgres code
const MISSING_COLUMN_CODE = 'PGRST204';
const UNDEFINED_COLUMN_CODE = '42703'; // Raw Postgres code

const KNOWN_MISSING_TABLES = new Set<string>();
const KNOWN_MISSING_COLUMNS = new Set<string>();

export function isMissingTableError(error: unknown, tableName: string) {
  if (KNOWN_MISSING_TABLES.has(tableName)) return true;
  if (!error || typeof error !== 'object') return false;

  const maybeError = error as SupabaseErrorLike;
  const code = String(maybeError.code);
  const isCodeMatch = code === MISSING_TABLE_CODE || code === UNDEFINED_TABLE_CODE;
  
  const isMatch = isCodeMatch
    && typeof maybeError.message === 'string'
    && maybeError.message.includes(`'${tableName}'`);

  if (isMatch) KNOWN_MISSING_TABLES.add(tableName);
  return isMatch;
}

export function isMissingColumnError(error: unknown, columnName?: string) {
  if (columnName && KNOWN_MISSING_COLUMNS.has(columnName)) return true;
  if (!error || typeof error !== 'object') return false;

  const maybeError = error as SupabaseErrorLike;
  const code = String(maybeError.code);
  const isCodeMatch = code === MISSING_COLUMN_CODE || code === UNDEFINED_COLUMN_CODE;
  
  if (!isCodeMatch || typeof maybeError.message !== 'string') {
    return false;
  }

  if (!columnName) return true;
  const isMatch = maybeError.message.includes(`'${columnName}'`) || maybeError.message.includes(`.${columnName}`);
  if (isMatch) KNOWN_MISSING_COLUMNS.add(columnName);
  return isMatch;
}

export function recordMissingColumn(columnName: string) {
  KNOWN_MISSING_COLUMNS.add(columnName);
}

export function isColumnKnownMissing(columnName: string) {
  return KNOWN_MISSING_COLUMNS.has(columnName);
}

export class MissingSupabaseFeatureError extends Error {
  readonly tableName: string;

  constructor(tableName: string, featureName: string, migrationName: string) {
    super(`${featureName} is unavailable because the connected Supabase project is missing the \`${tableName}\` table. Apply migration \`${migrationName}\`.`);
    this.name = 'MissingSupabaseFeatureError';
    this.tableName = tableName;
  }
}
