import { User } from "src/db/schema";
import { getPostsForUser } from "src/db/queries/feed";  

export async function printUsersFeed(cmdName: string, user: User, ...args: string[]) {
    const limit = args.length > 0 ? Number(args[0]) : 2;

    if (typeof limit !== 'number' || isNaN(limit)) {
        throw new Error('limit must be a valid number');
    }

    if (limit < 1 || limit > 50) {
        throw new Error('limit must be between 1 and 50');
    }

    const roundedLimit = Math.round(limit);


    console.log(`Browsing posts for user ${user.name} with limit ${roundedLimit}`);

    try {
        const posts = await getPostsForUser(user.id, roundedLimit);
        
        if (posts.length === 0) {
            console.log('No posts found for this user.');
            return;
        }
        
        for (const post of posts) {
        console.log(`Post: ${post.title} (${post.url}) published at ${post.publishedAt}`);
        }
    } catch (error) {
        console.error('Error fetching posts for user:', error);
        throw error;
    }
}