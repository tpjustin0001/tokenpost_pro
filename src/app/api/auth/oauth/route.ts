import { NextRequest, NextResponse } from 'next/server';

const TOKEN_URL = 'https://oapi.tokenpost.kr/oauth/v1/token';
const USER_INFO_URL = 'https://oapi.tokenpost.kr/oauth/v1/userInfo';
const CLIENT_ID = process.env.NEXT_PUBLIC_TP_CLIENT_ID || 's5ViDSauo8wENm2AgqPK39J2oI13PbVn';
const CLIENT_SECRET = process.env.NEXT_PUBLIC_TP_CLIENT_SECRET || 'xE4mNc8XQBHU3CNWrj3ci9HlFzbHXYdlot73EygyMEg54cKb9uK54X9DE130k08it2heu0B9703Ef701Y6ooOiSK67wrXn0yZ0DaEuG1N1iw3afJtN7QbnLdZm7FTfaa';
const REDIRECT_URI = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/'
    : 'https://pro.tokenpost.kr/';
const USER_INFO_SCOPE = 'user.email,user.nickname,subscription,grade,point.tpc';

// POST: Exchange code for tokens and fetch user profile
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, code_verifier } = body;

        if (!code) {
            return NextResponse.json({ error: 'Missing code' }, { status: 400 });
        }

        console.log('[OAuth API] Step 1: Exchanging code for tokens...');

        // Step 1: Exchange code for tokens
        const tokenBody = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            redirect_uri: REDIRECT_URI,
            ...(code_verifier && { code_verifier }),
        });

        const tokenResponse = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenBody.toString(),
        });

        const tokenData = await tokenResponse.json();
        console.log('[OAuth API] Token Response:', JSON.stringify(tokenData, null, 2));

        if (!tokenResponse.ok || tokenData.error) {
            return NextResponse.json({
                error: tokenData.error || 'Token exchange failed',
                message: tokenData.message || tokenData.error_description
            }, { status: 400 });
        }

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;

        // Step 2: Fetch user profile (scope 없이 호출하면 전체 데이터 반환)
        console.log('[OAuth API] Step 2: Fetching user profile (no scope = all data)...');

        const userInfoResponse = await fetch(USER_INFO_URL, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const userInfoData = await userInfoResponse.json();
        console.log('[OAuth API] UserInfo Response:', JSON.stringify(userInfoData, null, 2));

        if (!userInfoResponse.ok) {
            return NextResponse.json({
                error: 'Failed to fetch user info',
                tokens: { access_token: accessToken, refresh_token: refreshToken }
            }, { status: 200 }); // Still return tokens even if user info fails
        }

        // Step 3: Parse user data
        const userData = userInfoData.user || userInfoData;
        const user = {
            uuid: userData.uuid || userData.uid || '',
            nickname: userData.nickname || '',
            email: userData.email || '',
            profile_image: userData.profile_image || '',
            grade_name: userInfoData.grade?.name || userData.grade || '',
            grade_icon: userInfoData.grade?.icon_url || '',
            grade_exp: userInfoData.grade?.exp || 0,
            subscription_plan: userInfoData.subscription?.Plan || userInfoData.subscription?.plan || '',
            subscription_status: userInfoData.subscription?.status || '',
            point_tpc: userInfoData.point?.tpc || 0
        };

        console.log('[OAuth API] Parsed User:', user);

        return NextResponse.json({
            success: true,
            tokens: { access_token: accessToken, refresh_token: refreshToken },
            user: user,
            raw_response: userInfoData // Include raw response for debugging
        });

    } catch (error: any) {
        console.error('[OAuth API] Error:', error);
        return NextResponse.json({
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
}
