import { Feed, feedFollows, feeds, users, posts } from "../schema"
import { db } from "../index"
import { and, eq, is, sql, desc } from "drizzle-orm"

export async function createFeed({name, url, userId}: {name: string, url: string, userId: string}): Promise<Feed> {
    
    try {
        const rows = await db.insert(feeds).values({ name: name, url: url, userId: userId}).returning()
        return rows[0]
    } catch (err: any) {
        if (err?.code === "23505" || /unique/i.test(String(err?.message)) && /feeds.*url/i.test(String(err?.message))) {
            const dup = new Error("Duplicate URL");
            dup.name = "DuplicateUrlError";
            throw dup;
            }
    throw err;
    }
}

export type FeedRow = { name: string, url: string, userName: string}

export async function listFeeds(): Promise<FeedRow[]> {
    const feedList = await db
    .select({
        name: feeds.name,
        url: feeds.url,
        userName: users.name
    })
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id))

    return feedList
}


export async function createFeedFollow(userId: string, feedId: string) {

    const [newFeedFollow] = await db.insert(feedFollows).values({userId: userId, feedId: feedId}).returning({id: feedFollows.id})

    const [row] = await db.select({
        id: feedFollows.id,
        createdAt: feedFollows.createdAt,
        updatedAt: feedFollows.updatedAt,
        userId: feedFollows.userId,
        feedId: feedFollows.feedId,
        userName: users.name,
        feedName: feeds.name,
    })
    .from(feedFollows)
    .innerJoin(users, eq(users.id, feedFollows.userId))
    .innerJoin(feeds, eq(feeds.id, feedFollows.feedId))
    .where(eq(feedFollows.id, newFeedFollow.id))

    return row
}

export async function getFeedByUrl(url: string) {
    const [feed] = await db.select().from(feeds).where(eq(feeds.url, url))
    return feed
}

export async function getFeedFollowsForUser(userid: string) {
    const rows = await db.select({
        id: feedFollows.id,
        feedId: feedFollows.feedId,
        feedName: feeds.name
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feeds.id, feedFollows.feedId))
    .where(eq(feedFollows.userId, userid))
    return rows
}

export async function unfollowFeedDB(userId:string, url: string) {
    const feed =  await getFeedByUrl(url)
    if (!feed) {
        return { deletedResult: 0 }
    }

    const deleteResult = await db
        .delete(feedFollows)
        .where(and((eq(feedFollows.userId, userId), eq(feedFollows.feedId, feed.id))))
        .returning({ deletedResult: feedFollows.id })

    return {deleteResult: deleteResult.length}
}

export async function markFeedFetched(feedId: string) {
    const now = new Date();
    const res = await db
        .update(feeds)
        .set({ lastFetchedAt: now , updatedAt: now })
        .where(eq(feeds.id, feedId))
        .returning({ id: feeds.id })

    return res.length
}


export async function getNextFeedsToFetch() {
    const feed = await db
        .select()
        .from(feeds)
        .orderBy(sql `${feeds.lastFetchedAt} ASC NULLS FIRST`)
        .limit(1)
    return feed[0] ?? null;
}

export type CreatePostInput = {
  url: string
  feedId: string 
  title?: string
  description?: string
  publishedAt: Date
}

function isUniqueConstraintViolationError(e: unknown, constraint?: string): boolean {
  const pgCode = (e as any)?.code
  const name = (e as any)?.constraint
  if (pgCode === '23505') {
    return constraint ? name === constraint : true
  }
  return false
}

export async function createPost(postData: CreatePostInput) {

    try {
        const [newPost] = await db.insert(posts).values({
            url: postData.url,
            feedId: postData.feedId,
            title: postData.title ?? null,
            description: postData.description ?? null,
            publishedAt: postData.publishedAt
        }).returning()
        return { inserted: true, post: newPost }
    } catch (error) {
        if (isUniqueConstraintViolationError(error)) {
            return { inserted: false, post: null }
        }
        throw error;
    }
}

export async function getPostsForUser(userId: string, limit: number) {
    const postForUsers = await db.select({
        id: posts.id,
        title: posts.title,
        url: posts.url,
        description: posts.description,
        publishedAt: posts.publishedAt,
    })
    .from(feedFollows)
    .innerJoin(posts, eq(feedFollows.feedId, posts.feedId))
    .where(eq(feedFollows.userId, userId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)

    return postForUsers
}
