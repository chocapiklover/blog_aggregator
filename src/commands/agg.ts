import { clear } from "console";
import { create } from "domain";
import { createPost, getNextFeedsToFetch, markFeedFetched } from "src/db/queries/feed";
import { fetchFeed } from "src/libs/rss";

export async function agg(cmdName: string, ...args: string[]) {
    const durationString = args[0] || '1m';
    
    let intervalMs: number

    try{
        intervalMs = parseDuration(durationString);
    } catch {
        console.log(`Invalid time duration: ${durationString}`);
        return;
    }

    console.log(`Collecting feeds every ${durationString}`);

    let interval: NodeJS.Timeout | undefined;

    function handleError(error: any) {
        console.error(`Error in ${cmdName}: ${error}`);
        if (interval) clearInterval(interval);
    }

    await scrapeFeeds().catch(handleError);

    interval = setInterval(() => {
        scrapeFeeds().catch(handleError);
    }, intervalMs);

    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            if (interval) clearInterval(interval);
            resolve();
        });
    });
}

export async function scrapeFeeds() {
    
    const nextFeed = await getNextFeedsToFetch()
    if (!nextFeed) {
        console.log('No feeds to fetch.')
        return
    }

    console.log(`Fetching next feed: ${nextFeed.name} (${nextFeed.url})`)

    try {
        const fetched = await fetchFeed(nextFeed.url)

        markFeedFetched(nextFeed.id)
        console.log(`Marked feed as fetched: ${nextFeed.name}`)
        
        const items = fetched.channel.item || []
        if (items.length === 0) {
            console.log(`no posts found for feed: ${nextFeed.name}`)
            return
        }

        for (const post of items) {
            const url = post.link
            const title = post.title || null
            const description = post.description || null
            const parsedDate = parseAndValidateDate(post.pubDate)
        
            await createPost({
                url: url,
                feedId: nextFeed.id,
                title: title ?? undefined,
                description: description ?? undefined,
                publishedAt: parsedDate
            })
    }

    } catch (error) {
        console.error(`Error fetching feed: ${error}`)
    }
}

export function parseAndValidateDate(dateStr: string | undefined): Date {
    if (!dateStr) 
        return new Date();

    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
        return new Date();
    }

    return date;
}


export function parseDuration(durationStr: string): number {
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);

    if (!match) {
        throw new Error(`Invalid duration format: ${durationStr}`);
    }

    const value = match[1];
    const unit = match[2];

    switch (unit) {
        case 'ms':
            return parseInt(value, 10);
        case 's':
            return parseInt(value, 10) * 1000;
        case 'm':
            return parseInt(value, 10) * 1000 * 60;
        case 'h':
            return parseInt(value, 10) * 1000 * 60 * 60;
        default:
            throw new Error(`Unknown time unit: ${unit}`);
    }
}
