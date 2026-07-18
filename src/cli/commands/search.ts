import { search } from '../../core/search.js';
import { loadWorkspace } from '../../core/workspace.js';
import { dim, info, printJson } from '../output.js';

export interface SearchFlags {
  type?: string;
  tag?: string;
  status?: string;
  limit?: string;
  json?: boolean;
}

export async function runSearch(query: string, flags: SearchFlags): Promise<number> {
  const ws = await loadWorkspace(process.cwd());
  const hits = await search(ws, query, {
    type: flags.type,
    tag: flags.tag,
    status: flags.status,
    limit: flags.limit ? Number(flags.limit) : undefined,
  });

  if (flags.json) {
    printJson(hits);
    return 0;
  }

  if (hits.length === 0) {
    info(`No results for "${query}".`);
    return 0;
  }

  info(`${hits.length} result(s) for "${query}":\n`);
  for (const hit of hits) {
    const type = hit.type ? dim(`[${hit.type}]`) : '';
    info(`  ${hit.title} ${type}`);
    info(`    ${dim(hit.path)}`);
    if (hit.snippet.trim()) info(`    ${hit.snippet.replace(/\s+/g, ' ').trim()}`);
  }
  return 0;
}
