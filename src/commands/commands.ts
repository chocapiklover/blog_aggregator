import { setUser } from "src/config.js"

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>

export type CommandRegistry = Record<string, CommandHandler>


export function registerCommand(
    registry: CommandRegistry,
    cmdName: string, 
    handler: CommandHandler) {
    
        if (registry[cmdName]) {
        throw new Error(`command already registered: ${cmdName}`)
    }
    registry[cmdName] = handler
}

export async function runCommand(
    registry: CommandRegistry,
    cmdName: string, ...args: string[]) {
    
    const handler = registry[cmdName];
    if (!handler) {
        throw new Error(`unknown command: ${cmdName}`)
    }
    await handler(cmdName, ...args)
}

