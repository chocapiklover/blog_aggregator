import { readConfig } from "src/config"
import { getUser } from "src/db/queries/users"
import { createFeed, createFeedFollow, FeedRow, getFeedByUrl, getFeedFollowsForUser, listFeeds, unfollowFeedDB } from "src/db/queries/feed"
import { Feed, User } from "src/db/schema"

export async function createFeedCLI(cmdName: string, user: User, ...args: string[]) {
    if (args.length !== 2) {
        console.log(`Usage: addfeed <name> <url>`)
        process.exit(1)
    }

    const [name, url] = args

    try {
        const feed = await createFeed({name, url, userId: user.id })
        printFeed(feed, user)
        
        const ff = await createFeedFollow(user.id, feed.id);
        console.log(`${ff.feedName} : ${ff.userName}`);
    } catch (error: any) {
        if (error?.name === 'DuplicateUrlError') {
            console.log('A feed with that URL already exists.')
            process.exit(1)
        }
        console.log("Failed to create a feed.")
        process.exit(1)
    }
}

export function printFeed(feed: Feed, user: User ) {
    console.log(`
    id: ${feed.id}
    name: ${feed.name}
    url: ${feed.url}  
    userId: ${feed.userId}
    userName: ${user.name}
    `)
}

export async function feeds(...args: string[]) {
    console.log(args.length)
    if (args.length > 1) {
        console.log('usage: feeds')
        process.exit(1)
    }

    let feedList: FeedRow[] = []
    try {
        feedList = await listFeeds()

    } catch (error) {
        throw new Error(`feedlist is an empty`)
    }
    printFeedList(feedList)
}

export function printFeedList(feedList: FeedRow[]) {
    if (!feedList.length) {
        console.log("No feeds found.")
        return
    }

    for (const { name, url, userName } of feedList) {
        console.log(`- ${name} (${url}) by ${userName}`)
    }
}

export async function follow(cmdName: string, user: User, ...args: string[]) {
    const [url] = args
    if (!url) {
        throw new Error(`usage: ${cmdName} <url>`)
    } 


    const feed = await getFeedByUrl(url)
    if (!feed) {
        console.log(`FeedUrl ${url} doesnt exist in database`)
        process.exit(1)
    }

    try {
        const followFeed = await createFeedFollow(user.id, feed.id)
        console.log(`${followFeed.feedName} : ${followFeed.userName}`)
    } catch (err: any) {
        if (err.code === '23505') { // unique_violation in Postgres
            console.error('Already following this feed.');
            return;
        }
        console.error('Failed to follow:', err.message);
    }
}

export async function following(cmdName: string, user: User, ...args: string[]) {

    const rows = await getFeedFollowsForUser(user.id)
    for (const r of rows) {
        console.log(r.feedName)
    }
}

export async function unfollowFeed(cmdName: string, user: User, ...args: string[]) {
    if (args.length !== 1) {
        console.log(`Usage: unfollow <url>`)
        process.exit(1)
    }
    
    const [url] = args
    if (!url) {
        throw new Error(`usage: ${cmdName} <url>`)
    }

    try {
        const { deleteResult } = await unfollowFeedDB(user.id, url)

        if (deleteResult === 0) {
            console.log(`You are not following the feed with URL: ${url}`)
            return
        }
        console.log(`Unfollowed feed with URL: ${url}`)

    } catch (err: any) {
        console.error('Failed to unfollow:', err.message);
        process.exit(1);
    }
}

