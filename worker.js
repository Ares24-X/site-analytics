// Cloudflare Worker - Site Analytics API
// 使用 jose 库代替 google-auth-library（Workers 兼容）

import { SignJWT, importPKCS8 } from 'jose';

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 处理 CORS 预检
function handleOptions() {
  return new Response(null, { headers: corsHeaders });
}

// 硬编码凭证（从环境变量读取）
function getCredentials(env, siteId) {
  // 尝试从环境变量读取
  const clientEmail = env[`${siteId}_CLIENT_EMAIL`];
  let privateKey = env[`${siteId}_PRIVATE_KEY`];
  
  // 如果环境变量为空，使用硬编码（仅用于 pixelpdf）
  if (siteId === 'pixelpdf') {
    return {
      clientEmail: clientEmail || 'ga4-753@my-project-rmgtlrx.iam.gserviceaccount.com',
      privateKey: privateKey || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDiBpvd+VKk8Tal
dPzkKVqcEkA0ZKZLH1nS0Gg6szOqWit6CmVxwPvGJazfJLbaPX9Rz5x2W5x9E2Ry
jEQC3GsAiwaT7vTl4LQQ+bTDAvOv3xXWgayz3E7LiPFY09MtA+Uy6JLcZYqw5bMR
GYZm/Vi89O846DTF9cK01KTufTURyBq314BvTRKBIjDA9qlne0tg0KzSwqs4O1cQ
bJNRDeGKPkKqa4T7i2qROaHgGNW2FFOZ5Ylt4OlkUHRyab2i2aHqKSd/Tm+YIrI/
8aoSqkIBWx/fYwfAuV6+0+abmy9w3lD8xwqrsS1IuYEYk+CqVpBQRWjLFcqOOXeg
giSyL3Y7AgMBAAECggEARKRbK7NvLNZwkRkRQD1q3iEQzJiQhBn2TnaqYMFRfHe7
4mlL25sPG2MPuAjPW0H366GQU8WIpdeA1uTQNso32Mdf7QdR6oouRUWAZwT7errW
R/nDuC+84kUpfp9975rSPX6yMyrHTufDVPsafSaNj30XNYIXnNMBGafGmwL9XfOE
NazOuxsKhKSV497GL8Mp5r0EOEble7La56mH8XjL67fU6Kx0XpTkfWnidMgQqGqM
8hB6YRQMc/qU2Dj/QEKw2Uf178vB9XTuZprvsGZ5O2CZQXYr/vipvBneU7K6Gehb
U1nxv/Ct2YrX/DqnW08mvEtfR/75j5DFGhTxzAL+KQKBgQD35WFwHUDQgaqSXLb4
xZpCIxwIzjF/sGAr3eCDwjWFyidb3eMWRKww1hrnr0l3du0nGsO9J6NeF9ksyFUq
iB1ANBZfQpVheui9jI0QmDObl4Q5hh4c7Xmk5SEI6aA7vyIslMyHKlaVI4Ksxt4r
2D92n9/NdX3+YOZgfxoR3oGmdQKBgQDpajLQYfl1NQZfFwcBNVDnkY56gdUS2l0s
h0qvtR00p6q/H/dvLUrlRcjYy2i/FNVGPTuK8G4RK4Zh9SWzg6r9hsflA3NbZsZg
VtFsosJc3kWcbYWfPnYWEFfb8Ew+qTOHIPLzBgywh5OmgJ+gf6LFuwUUfkX8U60K
kNvFsRTz7wKBgQCdGZw3jgJuYU509Rbr72bENTXmCq5p6p/4DOPk/GYpBKUO3j60
9Q5e4MEqRPb9I7xFhPu5W254CgsTC16V1q8a6iendS3wGhF3VqRreNlz6IDeZ7Wb
xY/KxX67BDwMwSNqN16q5lT6rQd6cYmJJcGKbuVJcwVG+afmTYZ6/pURpQKBgFR+
qR5eGRugsknB4DtDvaHWQyl9zlAg1BHGd/bbLVNeTqUZQUzxrGcKuAYivCxPslTW
3bMSDgYRJ3hWcetmAoP8QmhYs22m6rD9PJqC4LEVlUVnMDPRPJYIHIX1muQkBA8q
kkf/LKDKs1xWu3IyQg4qAVDF1TfeYomsnqIV1GvpAoGAMZan23qPPJukUzjj7hZ3
k+KgU9uBiibOQzrGLyogog23gbqEQ1jL6SblphFqwqku5fBMn5zAzcp2uavUmpfQ
nAGvWmcm19xZ/1a/AIYvjuswzCEg7k0vm/ZamPiWqXQWxJLrG+TKRmObmt90o3Uy
5qcBe6cXivIYvQXJMD3Ig0M=
-----END PRIVATE KEY-----`,
    };
  }
  
  return { clientEmail, privateKey };
}

// 获取 Google Access Token（使用 jose 库）
async function getAccessToken(credentials, scopes) {
  const key = await importPKCS8(credentials.privateKey, 'RS256');
  
  const now = Math.floor(Date.now() / 1000);
  
  const jwt = await new SignJWT({
    scope: scopes.join(' '),
    iss: credentials.clientEmail,
    sub: credentials.clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token error: ${error}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// 获取 GA4 数据
async function fetchGA4Data(propertyId, accessToken, date) {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: date, endDate: date }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`GA4 API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const metrics = {
      sessions: 0,
      activeUsers: 0,
      pageViews: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
    };
    
    if (data.rows && data.rows.length > 0) {
      const row = data.rows[0];
      metrics.sessions = parseInt(row.metricValues[0].value) || 0;
      metrics.activeUsers = parseInt(row.metricValues[1].value) || 0;
      metrics.pageViews = parseInt(row.metricValues[2].value) || 0;
      metrics.avgSessionDuration = parseFloat(row.metricValues[3].value) || 0;
      metrics.bounceRate = parseFloat(row.metricValues[4].value) || 0;
    }
    
    return metrics;
  } catch (error) {
    console.error('GA4 error:', error);
    return {
      sessions: 0,
      activeUsers: 0,
      pageViews: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
    };
  }
}

// 获取 GSC 数据
async function fetchGSCData(siteUrl, accessToken, date) {
  try {
    const response = await fetch(
      'https://searchconsole.googleapis.com/webmasters/v3/sites/' + 
      encodeURIComponent(siteUrl) + '/searchAnalytics/query',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: date,
          endDate: date,
          dimensions: ['query'],
          rowLimit: 10,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`GSC API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      clicks: data.rows?.reduce((sum, r) => sum + (r.clicks || 0), 0) || 0,
      impressions: data.rows?.reduce((sum, r) => sum + (r.impressions || 0), 0) || 0,
      ctr: data.rows?.length > 0 
        ? data.rows.reduce((sum, r) => sum + (r.ctr || 0), 0) / data.rows.length 
        : 0,
      avgPosition: data.rows?.length > 0 
        ? data.rows.reduce((sum, r) => sum + (r.position || 0), 0) / data.rows.length 
        : 0,
      topQueries: data.rows?.slice(0, 5).map(r => ({
        query: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })) || [],
    };
  } catch (error) {
    console.error('GSC error:', error);
    return {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      avgPosition: 0,
      topQueries: [],
    };
  }
}

// 同步单个站点数据
async function syncSite(siteConfig, env) {
  const date = new Date().toISOString().split('T')[0];
  const cacheKey = `site_data_${siteConfig.id}_${date}`;
  
  try {
    // 获取凭证
    const credentials = getCredentials(env, siteConfig.id);
    
    if (!credentials.clientEmail || !credentials.privateKey) {
      throw new Error('Missing credentials');
    }
    
    // 获取 access token
    const accessToken = await getAccessToken(credentials, [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly',
    ]);
    
    // 并行获取 GA4 和 GSC 数据
    const [ga4Data, gscData] = await Promise.all([
      fetchGA4Data(siteConfig.ga4PropertyId, accessToken, date),
      fetchGSCData(siteConfig.gscSiteUrl, accessToken, date),
    ]);
    
    const siteData = {
      id: siteConfig.id,
      name: siteConfig.name,
      domain: siteConfig.domain,
      date,
      ga4: {
        ...ga4Data,
        topPages: [],
        topCountries: [],
        trafficSources: [],
        devices: [],
      },
      gsc: gscData,
    };
    
    // 存储到 KV
    await env.SITE_ANALYTICS_KV.put(cacheKey, JSON.stringify(siteData));
    
    return { success: true, siteId: siteConfig.id, data: siteData };
  } catch (error) {
    return { success: false, siteId: siteConfig.id, error: error.message };
  }
}

// 主处理函数
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    // API: 获取所有站点数据
    if (path === '/api/data' || path === '/api/data/') {
      const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
      const sites = JSON.parse(env.SITES_CONFIG || '[]');
      
      const results = [];
      for (const site of sites) {
        const cacheKey = `site_data_${site.id}_${date}`;
        const data = await env.SITE_ANALYTICS_KV.get(cacheKey);
        if (data) {
          results.push(JSON.parse(data));
        }
      }
      
      return new Response(
        JSON.stringify({
          date,
          lastUpdate: new Date().toISOString(),
          sites: results,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // API: 获取历史日期列表
    if (path === '/api/dates' || path === '/api/dates/') {
      const sites = JSON.parse(env.SITES_CONFIG || '[]');
      const siteId = url.searchParams.get('siteId');
      
      // 获取 KV 中所有 key
      const keys = [];
      let cursor;
      do {
        const listResult = await env.SITE_ANALYTICS_KV.list({ cursor, prefix: siteId ? `site_data_${siteId}_` : 'site_data_' });
        keys.push(...listResult.keys);
        cursor = listResult.cursor;
      } while (cursor);
      
      // 提取日期
      const dates = keys
        .map(k => k.name.split('_').pop())
        .filter((d, i, arr) => arr.indexOf(d) === i) // 去重
        .sort((a, b) => b.localeCompare(a)); // 降序
      
      return new Response(
        JSON.stringify({ dates }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // API: 手动触发同步
    if (path === '/api/sync' && request.method === 'POST') {
      const sites = JSON.parse(env.SITES_CONFIG || '[]');
      const results = [];
      
      for (const site of sites) {
        const result = await syncSite(site, env);
        results.push(result);
      }
      
      return new Response(
        JSON.stringify({ success: true, results }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // 404
    return new Response('Not Found', { status: 404 });
  },
  
  // 定时触发器（每6小时）
  async scheduled(event, env, ctx) {
    const sites = JSON.parse(env.SITES_CONFIG || '[]');
    
    for (const site of sites) {
      ctx.waitUntil(syncSite(site, env));
    }
  },
};
