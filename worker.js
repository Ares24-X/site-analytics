// Cloudflare Worker - Site Analytics API
// 自动抓取 GA4/GSC 数据并存储在 KV

import { JWT } from 'google-auth-library';

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

// 获取 Google Access Token
async function getAccessToken(credentials) {
  const jwtClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly',
    ],
  });
  
  const tokens = await jwtClient.authorize();
  return tokens.access_token;
}

// 获取 GA4 数据
async function fetchGA4Data(propertyId, accessToken, date) {
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
  
  // 解析指标
  const metrics = {};
  if (data.rows && data.rows.length > 0) {
    const row = data.rows[0];
    metrics.sessions = parseInt(row.metricValues[0].value) || 0;
    metrics.activeUsers = parseInt(row.metricValues[1].value) || 0;
    metrics.pageViews = parseInt(row.metricValues[2].value) || 0;
    metrics.avgSessionDuration = parseFloat(row.metricValues[3].value) || 0;
    metrics.bounceRate = parseFloat(row.metricValues[4].value) || 0;
  }
  
  return metrics;
}

// 获取 GSC 数据
async function fetchGSCData(siteUrl, accessToken, date) {
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
    ctr: data.rows?.reduce((sum, r) => sum + (r.ctr || 0), 0) / (data.rows?.length || 1) || 0,
    avgPosition: data.rows?.reduce((sum, r) => sum + (r.position || 0), 0) / (data.rows?.length || 1) || 0,
    topQueries: data.rows?.slice(0, 5).map(r => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    })) || [],
  };
}

// 同步单个站点数据
async function syncSite(siteConfig, env) {
  const date = new Date().toISOString().split('T')[0];
  const cacheKey = `site_data_${siteConfig.id}_${date}`;
  
  try {
    // 从环境变量获取凭证
    const credentials = {
      client_email: env[`${siteConfig.id}_CLIENT_EMAIL`],
      private_key: env[`${siteConfig.id}_PRIVATE_KEY`]?.replace(/\\n/g, '\n'),
    };
    
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Missing credentials');
    }
    
    // 获取 access token
    const accessToken = await getAccessToken(credentials);
    
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
    
    return { success: true, siteId: siteConfig.id };
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
