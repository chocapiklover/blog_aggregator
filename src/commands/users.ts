import { readConfig, setUser, writeConfig } from "src/config.js"
import { createUsers, getUsers } from "src/db/queries/users"

export async function handlerLogin(cmdName: string, ...args: string[]) {
    const [userName] = args
    if (!userName) {
        throw new Error(`usage: ${cmdName} <name>`)
    }

    const existing = await getUsers(userName)
    if (!existing) {
        throw new Error(`user ${userName} doesn't exist`)
    }

    await setUser(userName)
    console.log(`username ${userName} has been set`)
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
    const [userName] = args
    if (!userName) {
        throw new Error(`usage: ${cmdName} <name>`)
    }

    const existing = await getUsers(userName)

    if (existing) {
        throw new Error(`user ${userName} already exists`)
    }

    const user = await createUsers(userName);
    await setUser(user.name)

    console.log(`user: ${user.name} sucessfully registered!`)
}