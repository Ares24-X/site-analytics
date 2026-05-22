// 调用 Cloudflare Worker API

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://site-analytics-worker.your-subdomain.workers.dev';

// 获取所有站点数据
export async function fetchAllData(date?: string): Promise<any> {
  const url = date ? `${WORKER_URL}/api/data?date=${date}` : `${WORKER_URL}/api/data`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// 手动触发同步
export async function triggerSync(): Promise<any> {
  const response = await fetch(`${WORKER_URL}/api/sync`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Sync error: ${response.status}`);
  }
  
  return response.json();
}
