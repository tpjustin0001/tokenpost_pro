/**
 * ICS Calendar Parser - 거시경제 일정 파싱 및 한글 번역
 * 
 * Usage: npx ts-node scripts/parse-ics-to-sql.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 한글 번역 매핑
const TRANSLATIONS: Record<string, string> = {
    // 물가 지표
    "Consumer Price Index (MoM)": "소비자물가지수 (전월비)",
    "Consumer Price Index (YoY)": "소비자물가지수 (전년비)",
    "Consumer Price Index ex Food & Energy (MoM)": "근원 소비자물가지수 (전월비)",
    "Consumer Price Index ex Food & Energy (YoY)": "근원 소비자물가지수 (전년비)",
    "Core Harmonized Index of Consumer Prices (MoM)": "근원 소비자물가조화지수 (전월비)",
    "Core Harmonized Index of Consumer Prices (YoY)": "근원 소비자물가조화지수 (전년비)",
    "Harmonized Index of Consumer Prices (MoM)": "소비자물가조화지수 (전월비)",
    "Harmonized Index of Consumer Prices (YoY)": "소비자물가조화지수 (전년비)",
    "Producer Price Index (MoM)": "생산자물가지수 (전월비)",
    "Producer Price Index (YoY)": "생산자물가지수 (전년비)",
    "Producer Price Index ex Food & Energy (MoM)": "근원 생산자물가지수 (전월비)",
    "Producer Price Index ex Food & Energy (YoY)": "근원 생산자물가지수 (전년비)",

    // PCE 물가
    "Core Personal Consumption Expenditures (QoQ)": "근원 PCE 물가지수 (분기비)",
    "Core Personal Consumption Expenditures - Price Index (MoM)": "근원 PCE 물가지수 (전월비)",
    "Core Personal Consumption Expenditures - Price Index (YoY)": "근원 PCE 물가지수 (전년비)",
    "Personal Consumption Expenditures Prices (QoQ)": "PCE 물가지수 (분기비)",
    "Personal Consumption Expenditures - Price Index (MoM)": "PCE 물가지수 (전월비)",
    "Personal Consumption Expenditures - Price Index (YoY)": "PCE 물가지수 (전년비)",

    // 고용 지표
    "Nonfarm Payrolls": "비농업 고용지수",
    "ADP Employment Change": "ADP 고용변화",
    "ADP Employment Change 4-week average": "ADP 고용변화 4주 평균",
    "Initial Jobless Claims": "신규 실업수당 청구건수",
    "Unemployment Rate": "실업률",
    "U6 Underemployment Rate": "U6 불완전고용률",
    "Labor Force Participation Rate": "경제활동참가율",
    "Average Hourly Earnings (MoM)": "평균시간당임금 (전월비)",
    "Average Hourly Earnings (YoY)": "평균시간당임금 (전년비)",
    "JOLTS Job Openings": "JOLTS 구인건수",
    "Challenger Job Cuts": "챌린저 감원발표",
    "Labor Cash Earnings (YoY)": "노동현금수입 (전년비)",
    "Nonfarm Productivity": "비농업 생산성",
    "Unit Labor Costs": "단위노동비용",

    // GDP 및 경제성장
    "Gross Domestic Product Annualized": "GDP 연율",
    "Gross Domestic Product (QoQ)": "GDP (분기비)",
    "Gross Domestic Product (YoY)": "GDP (전년비)",
    "Gross Domestic Product Growth (QoQ) ": "GDP 성장률 (분기비)",
    "Gross Domestic Product Price Index": "GDP 물가지수",

    // 제조업/서비스업 PMI
    "ISM Manufacturing PMI": "ISM 제조업 PMI",
    "ISM Manufacturing Employment Index": "ISM 제조업 고용지수",
    "ISM Manufacturing New Orders Index": "ISM 제조업 신규주문지수",
    "ISM Manufacturing Prices Paid": "ISM 제조업 물가지수",
    "ISM Services PMI": "ISM 서비스업 PMI",
    "ISM Services Employment Index": "ISM 서비스업 고용지수",
    "ISM Services New Orders Index": "ISM 서비스업 신규주문지수",
    "ISM Services Prices Paid": "ISM 서비스업 물가지수",
    "S&P Global Composite PMI": "S&P 글로벌 종합 PMI",
    "S&P Global Manufacturing PMI": "S&P 글로벌 제조업 PMI",
    "S&P Global Services PMI": "S&P 글로벌 서비스업 PMI",
    "HCOB Composite PMI": "HCOB 종합 PMI",
    "HCOB Manufacturing PMI": "HCOB 제조업 PMI",
    "HCOB Services PMI": "HCOB 서비스업 PMI",
    "RatingDog Services PMI": "차이신 서비스업 PMI",

    // 소매/소비
    "Retail Sales (MoM)": "소매판매 (전월비)",
    "Retail Sales (YoY)": "소매판매 (전년비)",
    "Retail Sales ex Autos (MoM)": "자동차 제외 소매판매 (전월비)",
    "Retail Sales Control Group": "소매판매 통제그룹",
    "Consumer Confidence": "소비자신뢰지수",
    "Michigan Consumer Sentiment Index": "미시간 소비자심리지수",
    "Michigan Consumer Expectations Index": "미시간 소비자기대지수",
    "UoM 1-year Consumer Inflation Expectations": "미시간대 1년 인플레이션 기대",
    "UoM 5-year Consumer Inflation Expectation": "미시간대 5년 인플레이션 기대",
    "Personal Spending": "개인지출",
    "Personal Income (MoM)": "개인소득 (전월비)",

    // 주택
    "Housing Starts (MoM)": "주택착공 (전월비)",
    "Building Permits (MoM)": "건설허가 (전월비)",
    "Existing Home Sales Change (MoM)": "기존주택판매 변화 (전월비)",
    "New Home Sales Change (MoM)": "신규주택판매 변화 (전월비)",
    "Pending Home Sales (MoM)": "잠정주택판매 (전월비)",
    "Housing Price Index (MoM)": "주택가격지수 (전월비)",

    // 산업생산
    "Industrial Production (MoM)": "산업생산 (전월비)",
    "Industrial Production (YoY)": "산업생산 (전년비)",
    "Industrial Production s.a. (MoM)": "산업생산 계절조정 (전월비)",
    "Factory Orders (MoM)": "공장주문 (전월비)",
    "Durable Goods Orders": "내구재주문",
    "Durable Goods Orders ex Defense": "국방 제외 내구재주문",
    "Durable Goods Orders ex Transportation": "운송 제외 내구재주문",
    "Nondefense Capital Goods Orders ex Aircraft": "비국방 항공기 제외 자본재주문",

    // 무역
    "Trade Balance USD": "무역수지 (달러)",
    "Trade Balance CNY": "무역수지 (위안)",
    "Exports (YoY)": "수출 (전년비)",
    "Exports (YoY) CNY": "수출 (전년비, 위안)",
    "Imports (YoY)": "수입 (전년비)",
    "Imports (YoY) CNY": "수입 (전년비, 위안)",
    "Adjusted Merchandise Trade Balance": "조정 상품무역수지",
    "Merchandise Trade Balance Total": "총 상품무역수지",
    "Current Account n.s.a.": "경상수지",

    // 중앙은행 정책
    "Fed Interest Rate Decision": "연준 금리 결정",
    "Fed Monetary Policy Statement": "연준 통화정책 성명",
    "FOMC Press Conference": "FOMC 기자회견",
    "FOMC Economic Projections": "FOMC 경제전망",
    "Fed's Beige Book": "연준 베이지북",
    "Interest Rate Projections - 1st year": "금리전망 - 1년차",
    "Interest Rate Projections - 2nd year": "금리전망 - 2년차",
    "Interest Rate Projections - 3rd year": "금리전망 - 3년차",
    "Interest Rate Projections - Current": "금리전망 - 현재",
    "Interest Rate Projections - Longer": "금리전망 - 장기",

    "ECB Main Refinancing Operations Rate": "ECB 기준금리",
    "ECB Monetary Policy Statement": "ECB 통화정책 성명",
    "ECB Rate On Deposit Facility": "ECB 예금금리",
    "ECB Press Conference": "ECB 기자회견",
    "ECB Monetary Policy Meeting Accounts": "ECB 통화정책회의 의사록",

    "BoJ Interest Rate Decision": "일본은행 금리 결정",
    "BoJ Monetary Policy Statement": "일본은행 통화정책 성명",
    "BoJ Press Conference": "일본은행 기자회견",
    "BoJ Outlook Report": "일본은행 전망보고서",
    "BoJ Monetary Policy Meeting Minutes": "일본은행 통화정책회의 의사록",

    "PBoC Interest Rate Decision": "인민은행 금리 결정",
    "BoK Interest Rate Decision": "한국은행 금리 결정",

    // 설문/심리지수
    "ZEW Survey – Economic Sentiment": "ZEW 경기기대지수",
    "Sentix Investor Confidence": "Sentix 투자자신뢰지수",
    "Business Climate": "경기체감지수",
    "Economic Sentiment Indicator": "경기심리지수",
    "NY Empire State Manufacturing Index": "뉴욕 엠파이어 제조업지수",
    "Philadelphia Fed Manufacturing Survey": "필라델피아 연준 제조업지수",

    // 일본 관련
    "Tankan Large Manufacturing Index": "단칸 대기업 제조업지수",
    "Tankan Large Manufacturing Outlook": "단칸 대기업 제조업 전망",
    "Tankan Large All Industry Capex": "단칸 대기업 설비투자",
    "National Consumer Price Index (YoY)": "전국 소비자물가지수 (전년비)",
    "National CPI ex Food, Energy (YoY)": "전국 근원 소비자물가지수 (전년비)",
    "National CPI ex Fresh Food (YoY)": "전국 신선식품 제외 CPI (전년비)",
    "Tokyo Consumer Price Index (YoY)": "도쿄 소비자물가지수 (전년비)",
    "Large Retailer Sales": "대형소매점 판매",
    "Retail Trade (YoY)": "소매판매 (전년비)",
    "Retail Trade s.a (MoM)": "소매판매 계절조정 (전월비)",

    // 기타
    "Monthly Budget Statement": "월간 재정수지",
    "Eurogroup Meeting": "유로그룹 회의",
    "EcoFin Meeting": "경제재무이사회 회의",
};

// Fed/ECB 위원 번역
const FED_OFFICIALS: Record<string, string> = {
    "Chair Powell": "파월 의장",
    "Paulson": "폴슨 위원",
    "Kashkari": "카시카리 위원",
    "Barkin": "바킨 위원",
    "Miran": "미란 위원",
    "Bowman": "보우만 위원",
    "Bostic": "보스틱 위원",
    "Williams": "윌리엄스 위원",
    "Goolsbee": "굴스비 위원",
    "Barr": "바 위원",
    "Schmid": "슈미드 위원",
    "Collins": "콜린스 위원",
    "Jefferson": "제퍼슨 위원",
    "Musalem": "무살렘 위원",
};

const ECB_OFFICIALS: Record<string, string> = {
    "President Lagarde": "라가르드 총재",
    "Cipollone": "치폴로네 위원",
    "De Guindos": "데긴도스 위원",
    "Panetta": "파네타 위원",
    "Lane": "레인 위원",
    "Nagel": "나겔 위원",
    "Escrivá": "에스크리바 위원",
    "Villeroy": "빌르루아 위원",
};

// 유형 분류
function getEventType(title: string): string {
    if (title.includes('speech') || title.includes('Speech')) return '연설';
    if (title.includes('Interest Rate') || title.includes('금리')) return '금리';
    if (title.includes('PMI')) return 'PMI';
    if (title.includes('CPI') || title.includes('Consumer Price') || title.includes('물가')) return '물가';
    if (title.includes('GDP') || title.includes('Domestic Product')) return 'GDP';
    if (title.includes('Employment') || title.includes('Payrolls') || title.includes('Jobless') || title.includes('고용')) return '고용';
    if (title.includes('Retail') || title.includes('소매')) return '소매';
    if (title.includes('Housing') || title.includes('Home') || title.includes('주택')) return '주택';
    if (title.includes('Trade') || title.includes('Export') || title.includes('Import') || title.includes('무역')) return '무역';
    if (title.includes('Industrial') || title.includes('Manufacturing') || title.includes('제조')) return '제조업';
    if (title.includes('Confidence') || title.includes('Sentiment') || title.includes('심리')) return '심리지수';
    if (title.includes('Press Conference') || title.includes('기자회견')) return '기자회견';
    if (title.includes('Policy') || title.includes('정책')) return '정책';
    return '기타';
}

// 제목 번역
function translateTitle(title: string): string {
    // 중요도 제거
    let cleanTitle = title.replace(/\((HIGH|MEDIUM|LOW)\)$/i, '').trim();

    // 직접 번역 매핑 확인
    if (TRANSLATIONS[cleanTitle]) {
        return TRANSLATIONS[cleanTitle];
    }

    // Fed 위원 연설 처리
    const fedMatch = cleanTitle.match(/Fed's\s+(.+?)\s+speech/);
    if (fedMatch) {
        const official = fedMatch[1];
        const korName = FED_OFFICIALS[official] || `${official} 위원`;
        return `연준 ${korName} 연설`;
    }

    // ECB 위원 연설 처리
    const ecbMatch = cleanTitle.match(/ECB's\s+(.+?)\s+speech/);
    if (ecbMatch) {
        const official = ecbMatch[1];
        const korName = ECB_OFFICIALS[official] || `${official} 위원`;
        return `ECB ${korName} 연설`;
    }

    // 트럼프 연설
    if (cleanTitle.includes('President Trump speech')) {
        return '트럼프 대통령 연설';
    }

    // 부분 번역 시도
    for (const [eng, kor] of Object.entries(TRANSLATIONS)) {
        if (cleanTitle.includes(eng)) {
            return cleanTitle.replace(eng, kor);
        }
    }

    return cleanTitle;
}

// ICS 파싱
interface CalendarEvent {
    date: string;
    time: string;
    title: string;
    country: string;
    impact: string;
    type: string;
}

function parseICS(content: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const lines = content.split(/\r?\n/);

    let currentEvent: Partial<CalendarEvent> = {};
    let inEvent = false;
    let summaryBuffer = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line === 'BEGIN:VEVENT') {
            inEvent = true;
            currentEvent = {};
            summaryBuffer = '';
        } else if (line === 'END:VEVENT') {
            if (summaryBuffer) {
                // 국가 및 중요도 추출
                const match = summaryBuffer.match(/^(\w+)\s+(.+?)(?:\((HIGH|MEDIUM|LOW)\))?$/);
                if (match) {
                    currentEvent.country = match[1];
                    const rawTitle = match[2] + (match[3] ? `(${match[3]})` : '');
                    currentEvent.impact = match[3] || 'MEDIUM';
                    currentEvent.title = translateTitle(rawTitle);
                    currentEvent.type = getEventType(rawTitle);
                } else {
                    currentEvent.title = translateTitle(summaryBuffer);
                    currentEvent.impact = 'MEDIUM';
                    currentEvent.type = getEventType(summaryBuffer);
                }
            }

            if (currentEvent.date && currentEvent.time && currentEvent.title) {
                events.push(currentEvent as CalendarEvent);
            }
            inEvent = false;
        } else if (inEvent) {
            if (line.startsWith('DTSTART:')) {
                const dt = line.substring(8);
                // 20260103T151500Z 형식
                const match = dt.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/);
                if (match) {
                    // UTC -> KST (UTC+9)
                    const utcDate = new Date(Date.UTC(
                        parseInt(match[1]),
                        parseInt(match[2]) - 1,
                        parseInt(match[3]),
                        parseInt(match[4]),
                        parseInt(match[5]),
                        parseInt(match[6])
                    ));

                    // KST로 변환
                    const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

                    currentEvent.date = kstDate.toISOString().split('T')[0];
                    currentEvent.time = kstDate.toTimeString().split(' ')[0];
                }
            } else if (line.startsWith('SUMMARY:')) {
                summaryBuffer = line.substring(8);
            } else if (line.startsWith(' ') && summaryBuffer) {
                // 멀티라인 SUMMARY 처리
                summaryBuffer += line.substring(1);
            }
        }
    }

    return events;
}

// SQL 생성
function generateSQL(events: CalendarEvent[]): string {
    // 중복 제거 (같은 시간, 같은 제목)
    const uniqueEvents = new Map<string, CalendarEvent>();
    for (const event of events) {
        const key = `${event.date}_${event.time}_${event.title}`;
        if (!uniqueEvents.has(key)) {
            uniqueEvents.set(key, event);
        }
    }

    const sortedEvents = Array.from(uniqueEvents.values()).sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
    });

    let sql = `-- 2026년 거시경제 캘린더 일정 (자동 생성)
-- 총 ${sortedEvents.length}개 이벤트
-- 생성일: ${new Date().toISOString()}

-- 기존 2026년 데이터 삭제 (선택사항)
-- DELETE FROM calendar_events WHERE event_date >= '2026-01-01' AND event_date <= '2026-12-31';

INSERT INTO calendar_events (event_date, time, title, country, type, impact) VALUES\n`;

    const values = sortedEvents.map(event => {
        const escapedTitle = event.title.replace(/'/g, "''");
        return `('${event.date}', '${event.time}', '${escapedTitle}', '${event.country}', '${event.type}', '${event.impact}')`;
    });

    sql += values.join(',\n') + ';\n';

    // 월별 통계
    sql += '\n-- 월별 이벤트 수 통계:\n';
    const monthCounts: Record<string, number> = {};
    for (const event of sortedEvents) {
        const month = event.date.substring(0, 7);
        monthCounts[month] = (monthCounts[month] || 0) + 1;
    }
    for (const [month, count] of Object.entries(monthCounts).sort()) {
        sql += `-- ${month}: ${count}개\n`;
    }

    return sql;
}

// 메인 실행
async function main() {
    const icsPath = path.join(__dirname, '..', 'calendar-event-list.ics');
    const outputPath = path.join(__dirname, 'calendar-events-2026.sql');

    console.log('Reading ICS file...');
    const content = fs.readFileSync(icsPath, 'utf-8');

    console.log('Parsing events...');
    const events = parseICS(content);
    console.log(`Parsed ${events.length} events`);

    console.log('Generating SQL...');
    const sql = generateSQL(events);

    console.log(`Writing to ${outputPath}...`);
    fs.writeFileSync(outputPath, sql, 'utf-8');

    console.log('Done!');
    console.log(`Total unique events: ${events.length}`);
}

main().catch(console.error);
