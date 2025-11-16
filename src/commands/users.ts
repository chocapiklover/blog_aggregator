import { readConfig, setUser, writeConfig } from "src/config.js"
import { db } from "src/db"
import { createUsers, deleteUsers, getUser, getUsers } from "src/db/queries/users"
import { users } from "src/db/schema"

export async function handlerLogin(cmdName: string, ...args: string[]) {
    const [userName] = args
    if (!userName) {
        throw new Error(`usage: ${cmdName} <name>`)
    }

    const existing = await getUser(userName)
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

    const existing = await getUser(userName)

    if (existing) {
        throw new Error(`user ${userName} already exists`)
    }

    const user = await createUsers(userName);
    await setUser(user.name)

    console.log(`user: ${user.name} sucessfully registered!`)
}

export async function handlerReset(cmdName: string, ...args: string[]) {
    try {
        await db.delete(users); // cascades will delete feeds and feed_follows
        process.exit(0);
  } catch (err) {
        console.error(err);
        process.exit(1);
  }
}

export async function listUsers(cmdName: string, ...args: string[]) {
    const config = readConfig()
    const currentUser = config.currentUserName

    const usersList = await getUsers();

    for (const user of usersList) {
        const tag = user.name === currentUser ? " (current)" : "";
        console.log(`* ${user.name}${tag}`)
    }
}
