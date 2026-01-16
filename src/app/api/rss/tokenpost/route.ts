import { NextResponse } from 'next/server';

// RSS Feed 캐시
let cache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 300000; // 5분

export async function GET() {
    const now = Date.now();

    // 캐시 유효
    if (cache && now - cache.timestamp < CACHE_DURATION) {
        return NextResponse.json(cache.data);
    }

    try {
        const res = await fetch('https://www.tokenpost.kr/rss', {
            headers: {
                'Accept': 'application/rss+xml, application/xml, text/xml',
                'User-Agent': 'TokenPost PRO/1.0',
            },
            next: { revalidate: 300 }
        });

        if (!res.ok) {
            throw new Error(`RSS fetch failed: ${res.status}`);
        }

        const xml = await res.text();

        // 간단한 XML 파싱 (item 추출)
        const items: any[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xml)) !== null) {
            const itemXml = match[1];

            const getTag = (tag: string) => {
                const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
                const m = itemXml.match(regex);
                return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
            };

            // 이미지 추출 (enclosure 또는 media:content)
            let thumbnail = '';
            const enclosureMatch = itemXml.match(/<enclosure[^>]+url="([^"]+)"/);
            if (enclosureMatch) thumbnail = enclosureMatch[1];

            const mediaMatch = itemXml.match(/<media:content[^>]+url="([^"]+)"/);
            if (!thumbnail && mediaMatch) thumbnail = mediaMatch[1];

            // 날짜 파싱
            const pubDate = getTag('pubDate');
            let timeAgo = '';
            if (pubDate) {
                const diff = Date.now() - new Date(pubDate).getTime();
                const hours = Math.floor(diff / 3600000);
                if (hours < 1) timeAgo = '방금';
                else if (hours < 24) timeAgo = `${hours}시간 전`;
                else timeAgo = `${Math.floor(hours / 24)}일 전`;
            }

            items.push({
                id: `rss-${items.length}`,
                type: 'NEWS',
                typeKo: '뉴스',
                title: getTag('title'),
                source: 'TokenPost',
                time: timeAgo,
                link: getTag('link'),
                summary: getTag('description').slice(0, 200),
                thumbnail: thumbnail,
                isPro: false,
                isBreaking: false,
            });

            if (items.length >= 20) break;
        }

        cache = { data: items, timestamp: now };
        return NextResponse.json(items);
    } catch (error) {
        console.error('RSS fetch error:', error);
        if (cache) {
            return NextResponse.json(cache.data);
        }
        return NextResponse.json([], { status: 500 });
    }
}
