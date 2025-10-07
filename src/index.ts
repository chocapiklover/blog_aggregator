import { readConfig, setUser } from "./config.js";
import { CommandRegistry, runCommand } from "./commands/commands.js";
import { registerCommand } from "./commands/commands.js";
import { handlerLogin, handlerRegister } from "./commands/users.js";


async function main() {
    const registry: CommandRegistry = {}
    registerCommand(registry, 'login', handlerLogin)
    registerCommand(registry, 'register', handlerRegister)

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