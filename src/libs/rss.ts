import { XMLParser } from "fast-xml-parser";
import { normalize } from "path";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string) {

    const res = await fetch(feedURL, {
        headers: {"User-Agent": "gator"},
    })

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
    }

    //converts to string
    const xml = await res.text()

    const parser = new XMLParser();
    const data = parser.parse(xml)

    let channel = data?.rss?.channel ?? data?.channel;

    if (!channel) {
        throw new Error("missing channel")
    }

    const { title, link, description } = channel

    // normalize rawItems to array
    let rawItems = channel.item;
    let items: RSSItem[] = 
        Array.isArray(rawItems) ? rawItems 
        : rawItems && typeof rawItems === 'object' ? [rawItems]
        : []

    items = items.filter(it => 
        typeof it?.title === 'string' &&
        typeof it?.link === 'string' &&
        typeof it?.description === 'string' &&
        typeof it?.pubDate === 'string'
    )

    return { channel: {
        title,
        link,
        description,
        item: items
        }
    }
}