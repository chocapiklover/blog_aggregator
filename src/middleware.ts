import { CommandHandler } from "./commands/commands";
import { User } from "./db/schema";
import { getUser } from "./db/queries/users";
import { readConfig } from "./config";

type UserCommandHandler = (
    cmdName: string,
    user: User,
    ...args: string[]) => Promise<void>;

type middlewareLoggedIn = (
    handler: UserCommandHandler
) => CommandHandler;

export function middlewareLoggedIn(
    handler: UserCommandHandler
): CommandHandler {
    return async (cmdName: string, ...args: string[]) => {
        
        const config = readConfig();
        const currentUserName = config.currentUserName;

        if (!currentUserName) {
            console.log("No user is currently logged in. Please log in first.");
            process.exit(1);
        }

        const user = await getUser(currentUserName);
        if (!user) {
            console.log(
                `User '${currentUserName}' does not exist in the database. Please log in with a valid user.`
            );
            process.exit(1);
        }

        await handler(cmdName, user, ...args);
    };
}