import { OQLParseListener } from './OQLParseListener';

/** Relops from OQL.g4: `=` `!=` `>` `<` `>=` `<=`. */
const OQL_RELOP = /[=<>]/;

/**
 * Structured OQL has field/operator atoms. Anything else is treated as
 * full-text search (the server rewrites it to `text="..."`).
 */
export function isStructuredOQL(query: string | null | undefined): boolean {
  return OQL_RELOP.test(query ?? '');
}

/** True when the query should go through advanced OQL search, including bare text. */
export function isAdvancedOQL(query: string | null | undefined): boolean {
  const q = (query ?? '').trim();
  if (!q) {
    return false;
  }
  if (!isStructuredOQL(q)) {
    return true;
  }
  const visitor = new OQLParseListener(q);
  return visitor.index.length >= 3 && visitor.errors.length === 0;
}
