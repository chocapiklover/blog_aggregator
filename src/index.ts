import { readConfig, setUser } from "./config.js";
import { CommandRegistry, runCommand } from "./commands/commands.js";
import { registerCommand } from "./commands/commands.js";
import { handlerLogin, handlerRegister, handlerReset, listUsers } from "./commands/users.js";
import { agg } from "./commands/agg.js";
import { createFeedCLI, feeds, follow, following, unfollowFeed } from "./commands/feed.js";
import { middlewareLoggedIn } from "./middleware.js";
import { printUsersFeed } from "./commands/browse.js";


async function main() {
    const registry: CommandRegistry = {}
    registerCommand(registry, 'login', handlerLogin)
    registerCommand(registry, 'register', handlerRegister)
    registerCommand(registry, 'reset', handlerReset)
    registerCommand(registry, 'users', listUsers)
    registerCommand(registry, 'agg', agg)
    registerCommand(registry, 'addfeed', middlewareLoggedIn(createFeedCLI))
    registerCommand(registry, 'feeds', feeds)
    registerCommand(registry, 'follow', middlewareLoggedIn(follow))
    registerCommand(registry, 'following', middlewareLoggedIn(following))
    registerCommand(registry, 'unfollow', middlewareLoggedIn(unfollowFeed))
    registerCommand(registry, 'browse', middlewareLoggedIn(printUsersFeed))

    const argv = process.argv.slice(2)
    if (argv.length < 1) {
        console.log('usage: cli <command> [args...]')
        process.exit(1)
    }

    const [cmdName, ...cmdArgs] = argv

    try {
        await runCommand(registry, cmdName, ...cmdArgs)
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.log(msg)
        process.exit(1)
    }
    process.exit(0)
}

main();