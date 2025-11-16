import { eq } from "drizzle-orm";
import { db } from "../index"
import { users } from "../schema"

export async function createUsers(name: string) {
    const [result] = await db.insert(users).values({ name: name}).returning();
    return result;
}

export async function getUser(userName: string) {
    const [result] = await db.select().from(users).where(eq(users.name, userName))
    return result
}

export async function deleteUsers() {
    const [result] = await db.delete(users)
    return result
}

export async function getUsers() {
    const rows = await db.select({ name: users.name }).from(users)
    return rows
}