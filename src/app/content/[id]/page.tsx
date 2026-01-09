import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

interface ContentPageProps {
    params: Promise<{ id: string }>;
}

// Mock PRO content data
const MOCK_CONTENT = {
    id: '1',
    title: 'AI 분석: 비트코인 단기 지지선 $92,000',
    type: 'PRO',
    author: 'TokenPost AI',
    publishedAt: '2026-01-09',
    readTime: '5분',
    thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=400&fit=crop',
    summary: '온체인 데이터와 파생상품 지표를 종합 분석한 결과, 비트코인의 단기 핵심 지지선은 $92,000입니다.',
    content: `
## 핵심 요약

비트코인은 현재 $94,500 근처에서 거래되고 있으며, 온체인 데이터와 파생상품 지표를 종합 분석한 결과 **$92,000**이 핵심 단기 지지선으로 확인되었습니다.

## 온체인 분석

### 1. 실현 가격 분포

단기 보유자(STH)의 평균 매수가는 $91,800입니다. 이 수준 아래로 하락 시 대규모 손절매가 발생할 수 있어 강력한 지지선 역할을 합니다.

### 2. 거래소 유입량

최근 7일간 거래소 유입량이 15% 감소했습니다. 이는 매도 압력 감소를 의미하며 긍정적 신호입니다.

### 3. 고래 활동

$50M 이상 대규모 거래가 지난 48시간 동안 23건 발생했으며, 대부분이 거래소에서 개인 지갑으로의 이동(축적)이었습니다.

## 파생상품 분석

### 오픈 인터레스트

BTC 선물 OI는 $15.9B로 사상 최고치에 근접합니다. 레버리지 포지션이 많아 변동성에 주의가 필요합니다.

### 펀딩 레이트

현재 펀딩 레이트는 +0.015%로 중립~약간 롱 편향입니다. 과열 수준(+0.05% 이상)에는 미치지 않습니다.

## 투자 전략 제안

1. **단기 매매**: $92,000-$92,500 구간에서 분할 매수 고려
2. **손절**: $90,000 하향 이탈 시 손절
3. **목표가**: $98,000-$100,000

## 리스크 요인

- 미국 거시경제 지표 발표 (1/10)
- Mt.Gox 물량 배분 (잠재적 매도 압력)
- ETF 자금 흐름 변화

---

*본 분석은 투자 조언이 아니며, 투자 결정은 본인의 판단 하에 이루어져야 합니다.*
  `,
    tags: ['비트코인', '온체인분석', 'AI분석', '지지/저항'],
    relatedArticles: [
        { id: '2', title: 'ETF 자금 흐름이 시사하는 시장 방향', type: 'PRO' },
        { id: '3', title: 'DeFi 섹터 로테이션 시그널 감지', type: 'PRO' },
    ]
};

export default async function ContentPage({ params }: ContentPageProps) {
    const { id } = await params;
    const content = MOCK_CONTENT; // 실제는 id로 fetch

    return (
        <div className={styles.appLayout}>
            <Sidebar />

            <div className={styles.mainArea}>
                <main className={styles.content}>
                    <article className={styles.article}>
                        {/* Header */}
                        <header className={styles.articleHeader}>
                            <div className={styles.meta}>
                                <span className={styles.proBadge}>PRO</span>
                                <span className={styles.author}>{content.author}</span>
                                <span className={styles.dot}>·</span>
                                <span className={styles.date}>{content.publishedAt}</span>
                                <span className={styles.dot}>·</span>
                                <span className={styles.readTime}>{content.readTime} 읽기</span>
                            </div>
                            <h1 className={styles.title}>{content.title}</h1>
                            <p className={styles.summary}>{content.summary}</p>
                        </header>

                        {/* Thumbnail */}
                        <div className={styles.thumbnailWrapper}>
                            <img src={content.thumbnail} alt="" className={styles.thumbnail} />
                        </div>

                        {/* Content */}
                        <div className={styles.articleBody}>
                            {content.content.split('\n').map((line, i) => {
                                if (line.startsWith('## ')) {
                                    return <h2 key={i} className={styles.h2}>{line.replace('## ', '')}</h2>;
                                }
                                if (line.startsWith('### ')) {
                                    return <h3 key={i} className={styles.h3}>{line.replace('### ', '')}</h3>;
                                }
                                if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                                    return <li key={i} className={styles.li}>{line.replace(/^\d\. /, '')}</li>;
                                }
                                if (line.startsWith('- ')) {
                                    return <li key={i} className={styles.li}>{line.replace('- ', '')}</li>;
                                }
                                if (line.startsWith('---')) {
                                    return <hr key={i} className={styles.hr} />;
                                }
                                if (line.startsWith('*') && line.endsWith('*')) {
                                    return <p key={i} className={styles.disclaimer}>{line.replace(/\*/g, '')}</p>;
                                }
                                if (line.trim()) {
                                    return <p key={i} className={styles.p}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
                                }
                                return null;
                            })}
                        </div>

                        {/* Tags */}
                        <div className={styles.tags}>
                            {content.tags.map(tag => (
                                <span key={tag} className={styles.tag}>#{tag}</span>
                            ))}
                        </div>

                        {/* Related */}
                        <div className={styles.related}>
                            <h4 className={styles.relatedTitle}>관련 분석</h4>
                            <div className={styles.relatedList}>
                                {content.relatedArticles.map(article => (
                                    <a key={article.id} href={`/content/${article.id}`} className={styles.relatedItem}>
                                        <span className={styles.proBadgeSmall}>PRO</span>
                                        {article.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </article>
                </main>
            </div>
        </div>
    );
}
