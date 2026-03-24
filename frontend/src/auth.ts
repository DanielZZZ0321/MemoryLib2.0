const AUTH_TOKEN_KEY = 'auth_token';

async function parseJson(res: Response): Promise<unknown> {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function register(email: string, password: string): Promise<{ user: { id: number; email: string }; token: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = (await parseJson(res)) as { success?: boolean; error?: string; token?: string; user?: { id: number; email: string } };
  if (!data) throw new Error('无法连接服务器，请确认后端已启动');
  if (!data.success) throw new Error(data.error || '注册失败');
  if (data.token) localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  return { user: data.user!, token: data.token! };
}

export async function login(email: string, password: string): Promise<{ user: { id: number; email: string }; token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = (await parseJson(res)) as { success?: boolean; error?: string; token?: string; user?: { id: number; email: string } };
  if (!data) throw new Error('无法连接服务器，请确认后端已启动');
  if (!data.success) throw new Error(data.error || '登录失败');
  if (data.token) localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  return { user: data.user!, token: data.token! };
}

export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function getMe(): Promise<{ id: number; email: string } | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const data = (await parseJson(res)) as { success?: boolean; user?: { id: number; email: string } };
  return data?.success && data.user ? data.user : null;
}
