import { setUser } from "src/config.js"

export async function handlerLogin(cmdName: string, ...args: string[]) {
    const [userName] = args
    if (!userName) {
        throw new Error(`usage: ${cmdName} <name>`)
    }

    setUser(userName)
    console.log(`username ${userName} has been set`)
}