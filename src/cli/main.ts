#!/usr/bin/env node
import { Command } from 'commander';
import { baabVersion } from '../core/version.js';
import { runDoctor } from './commands/doctor.js';
import { runFolderAdd } from './commands/folder.js';
import { runIndex } from './commands/index-cmd.js';
import { runInit } from './commands/init.js';
import { runNew } from './commands/new.js';
import { runSearch } from './commands/search.js';
import { runServe } from './commands/serve.js';
import { runStatus } from './commands/status.js';
import { reportError } from './output.js';

/** Wrap an async command so its resolved number becomes the process exit code. */
function wrap(fn: () => Promise<number>): void {
  fn()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((err) => {
      process.exitCode = reportError(err);
    });
}

/** Collect a repeatable option into an array. */
function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

const program = new Command();

program
  .name('baab')
  .description('Business-as-a-Book — a governed, indexed, agent-ready markdown workspace.')
  .version(baabVersion(), '-v, --version');

program
  .command('init')
  .description('Scaffold a new workspace')
  .argument('<name>', 'workspace / business name')
  .option('--dir <path>', 'target directory (default: ./<name>)')
  .option('--no-git', 'skip git initialization')
  .option('--no-claude', 'skip the .claude/ integration layer')
  .option('--devcontainer', 'also generate a .devcontainer/ (Codespaces-ready)')
  .option('--template <dir>', 'override the workspace template directory')
  .option('--json', 'output JSON')
  .action((name, opts) => {
    wrap(() =>
      runInit(name, {
        dir: opts.dir,
        git: opts.git,
        claude: opts.claude,
        devcontainer: opts.devcontainer,
        template: opts.template,
        json: opts.json,
      }),
    );
  });

program
  .command('new')
  .description('Spawn an entity, project, client, or app from a template')
  .argument('<kind>', 'entity | project | client | app')
  .argument('<slug>', 'lowercase-hyphenated slug')
  .option('--name <display>', 'display name (default: title-cased slug)')
  .option('--template <dir>', 'override template directory')
  .option('--json', 'output JSON')
  .action((kind, slug, opts) => {
    wrap(() => runNew(kind, slug, { name: opts.name, template: opts.template, json: opts.json }));
  });

const folder = program.command('folder').description('Manage governed folders');
folder
  .command('add')
  .description('Add a governed folder (CLAUDE.md + _index.md + config registration)')
  .argument('<name>', 'lowercase-hyphenated folder name')
  .option('--kind <kind>', 'a kind this folder hosts (repeatable)', collect, [])
  .option('--json', 'output JSON')
  .action((name, opts) => {
    wrap(() => runFolderAdd(name, { kind: opts.kind, json: opts.json }));
  });

program
  .command('index')
  .description('Build/rebuild the search index and regenerate registries')
  .option('--json', 'output JSON')
  .action((opts) => {
    wrap(() => runIndex({ json: opts.json }));
  });

program
  .command('search')
  .description('Full-text search across the workspace')
  .argument('<query>', 'search query')
  .option('--type <type>', 'filter by frontmatter type')
  .option('--tag <tag>', 'filter by tag')
  .option('--status <status>', 'filter by status')
  .option('--limit <n>', 'max results (default 20)')
  .option('--json', 'output JSON')
  .action((query, opts) => {
    wrap(() =>
      runSearch(query, {
        type: opts.type,
        tag: opts.tag,
        status: opts.status,
        limit: opts.limit,
        json: opts.json,
      }),
    );
  });

program
  .command('doctor')
  .alias('validate')
  .description('Check the workspace against the four laws')
  .option('--json', 'output JSON')
  .action((opts) => {
    wrap(() => runDoctor({ json: opts.json }));
  });

program
  .command('status')
  .description('Workspace overview')
  .option('--json', 'output JSON')
  .action((opts) => {
    wrap(() => runStatus({ json: opts.json }));
  });

program
  .command('serve')
  .description('Run the local HTTP API over this workspace')
  .option('--port <n>', 'port (default 4100)')
  .option('--host <host>', 'host (default 127.0.0.1)')
  .option('--write', 'enable mutating POST endpoints (default read-only)')
  .option('--json', 'print the server URL as JSON')
  .action((opts) => {
    wrap(() => runServe({ port: opts.port, host: opts.host, write: opts.write, json: opts.json }));
  });

program.parseAsync(process.argv).catch((err) => {
  process.exitCode = reportError(err);
});
