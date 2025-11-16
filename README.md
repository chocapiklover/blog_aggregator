# blog_aggregator

A TypeScript CLI for curating and browsing RSS feeds with PostgreSQL persistence. The tool lets you create users, register feeds, follow or unfollow them, aggregate posts on a schedule, and browse a personalized timeline directly from your terminal.

## Requirements
- Node.js `v22.15.0` (`nvm use` reads from `.nvmrc`)
- npm 
- PostgreSQL 14+

## Installation
```bash
npm install
```

## Configuration
The CLI reads a JSON file named `.gatorconfig.json` from your home directory. It must include the database connection string and the currently logged in user.

```json
{
  "db_url": "postgres://user:pass@localhost:5432/blog_aggregator",
  "current_user_name": ""
}
```

Notes:
- `db_url` is required everywhere (including during migrations).
- `current_user_name` can be blank; it is set automatically by `register` or `login`.

## Database workflows
- Generate SQL from the Drizzle schema: `npm run db:generate`
- Apply pending migrations: `npm run db:migrate`
- The schema lives in `src/db/schema.ts` and migrations are stored in `src/db/migrations/`.

## Running the CLI
Every command is executed through the entry point in `src/index.ts`.

```bash
# general form
npm start -- <command> [args]

# example: register a user named "ada"
npm start -- register ada
```

You can also invoke it via `npx tsx src/index.ts <command>` if you prefer.

## Recommended flow
1. `register <name>` and/or `login <name>` to set the active user (stored in `.gatorconfig.json`).
2. `addfeed <displayName> <rssUrl>` to create a feed you own. The user automatically follows it.
3. `feeds` to see all feeds across users.
4. `follow <rssUrl>` or `unfollow <rssUrl>` to manage subscriptions; `following` lists your current follows.
5. Run `agg [interval]` (defaults to `1m`) to periodically fetch posts for every feed. Leave it running; stop with `Ctrl+C`.
6. `browse [limit]` (default `2`, cap `50`) to print the newest posts from feeds you follow.

## Command reference
| Command | Description |
| --- | --- |
| `register <name>` | Create a user if it does not exist and set it as current. |
| `login <name>` | Switch the active user (must already exist). |
| `users` | List all users; the active one is annotated with `(current)`. |
| `reset` | Danger zone: deletes every user/feed/post by truncating tables with cascading deletes. |
| `addfeed <name> <url>` | Create a feed owned by the current user and auto-follow it. |
| `feeds` | Print all feeds with their owners. |
| `follow <url>` | Follow an existing feed by its exact URL. |
| `following` | List the feeds the current user follows. |
| `unfollow <url>` | Stop following the feed at the given URL. |
| `browse [limit=2]` | Show newest posts from followed feeds, limited to 1–50 items. |
| `agg [interval=1m]` | Continuously fetch RSS content. Supports `ms`, `s`, `m`, `h` (e.g., `30s`, `5m`). |

## Aggregator (`agg`) details
- Pulls feeds in round-robin order based on `last_fetched_at`.
- For each RSS item, it stores unique posts (duplicates are skipped quietly).
- Default interval is `1m`. Invalid intervals (anything outside `/^\d+(ms|s|m|h)$/`) abort the command.
- Logs progress and handles `Ctrl+C` cleanly by clearing the polling timer.

## Browsing posts
`browse` reads posts produced by the aggregator for feeds the current user follows. If nothing appears, ensure:
1. You follow at least one feed (`following`).
2. `agg` has run since you followed that feed.
3. The RSS source exposes items with a `pubDate`.

## Troubleshooting
- **"No user is currently logged in"**: run `register` or `login`.
- **Duplicate feed URL**: the URL must be unique in the `feeds` table; reuse it only for following.
- **`db_url must be a string`**: confirm `.gatorconfig.json` is valid JSON and contains the key.
- **Aggregator hangs on fetch**: verify the RSS URL is reachable from your network and returns XML.

## Tech stack
- TypeScript + `tsx` runner for the CLI
- PostgreSQL + `drizzle-orm` for persistence
- `fast-xml-parser` for RSS parsing
- `postgres` (the npm driver) for database connections

## Contributing
1. Fork/clone, install dependencies, and configure `.gatorconfig.json`.
2. Run migrations against a local Postgres instance.
3. Add or update commands and queries.
4. Validate with `npm start -- <command>` and share patches via PR.
