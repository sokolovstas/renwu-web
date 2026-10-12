/**
 * Agent comments persist YAML front matter for the worker
 * (`status`, `branch`, `mr_url`, …). Chat and jobs must not show it.
 *
 * Mirrors services/ai/worker/markdown_result.go splitAgentFrontMatter.
 */

const AGENT_YAML_KEY =
  /^(status|outcome|summary|branch|mr_url|commits|questions|artifacts|tests|notes|repository|repositories|repo|deliveries|projects|review)\s*:/i;

const ANY_YAML_KEY = /^[A-Za-z0-9_./-]+:(?:\s|$)/;

const YAML_CONTINUATION =
  /^(?:\s+\S|-\s|\.\.\.\s*$|---\s*$|"[\s\S]*"\s*$|'[\s\S]*'\s*$)/;

export function stripAgentFrontMatter(markdown: string): string {
  if (!markdown) {
    return markdown;
  }
  let rest = markdown.replace(/^\uFEFF/, '').replace(/^\s+/, '');
  rest = stripFencedYaml(rest);
  rest = stripDashedYaml(rest);
  rest = stripBareAgentYaml(rest);
  return rest.replace(/^\s+/, '');
}

function stripFencedYaml(s: string): string {
  const m = s.match(/^```ya?ml[^\n]*\r?\n([\s\S]*?)\r?\n```(?:\r?\n|$)/i);
  if (!m || !looksLikeAgentYaml(m[1])) {
    return s;
  }
  return s.slice(m[0].length);
}

function stripDashedYaml(s: string): string {
  if (!s.startsWith('---')) {
    return s;
  }
  const nl = s.indexOf('\n');
  if (nl < 0) {
    return s;
  }
  const rest = s.slice(nl + 1);
  const close = rest.search(/\r?\n---\s*(?:\r?\n|$)/);
  if (close < 0) {
    return s;
  }
  const inner = rest.slice(0, close);
  if (!looksLikeAgentYaml(inner)) {
    return s;
  }
  const closer = rest.slice(close).match(/^\r?\n---\s*(?:\r?\n|$)/);
  if (!closer) {
    return s;
  }
  return rest.slice(close + closer[0].length);
}

function stripBareAgentYaml(s: string): string {
  const lines = s.split(/\r?\n/);
  let i = 0;
  while (
    i < lines.length &&
    (lines[i].trim() === '' || /^---\s*$/.test(lines[i]))
  ) {
    i++;
  }
  if (i >= lines.length || !AGENT_YAML_KEY.test(lines[i])) {
    return s;
  }
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      continue;
    }
    if (
      AGENT_YAML_KEY.test(line) ||
      ANY_YAML_KEY.test(line) ||
      YAML_CONTINUATION.test(line)
    ) {
      continue;
    }
    break;
  }
  if (i === 0) {
    return s;
  }
  return lines.slice(i).join('\n');
}

function looksLikeAgentYaml(block: string): boolean {
  return block.split(/\r?\n/).some((line) => AGENT_YAML_KEY.test(line));
}
