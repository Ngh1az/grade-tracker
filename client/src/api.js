const TOKEN_KEY = 'gt_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Lỗi có mang mã để phía UI phân biệt hết phiên (401) với chưa chọn bậc (409). */
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Lỗi ${res.status}`;
    let code;
    try {
      const body = await res.json();
      code = body.code;
      if (body.errors) message = body.errors.join(', ');
      else if (body.error) message = body.error;
    } catch {
      // response has no JSON body
    }
    throw new ApiError(message, res.status, code);
  }
  return res.status === 204 ? null : res.json();
}

const AUTH = '/api/auth';
const SUBJECTS = '/api/subjects';

export const register = (email, password) =>
  request(`${AUTH}/register`, { method: 'POST', body: JSON.stringify({ email, password }) });
export const login = (email, password) =>
  request(`${AUTH}/login`, { method: 'POST', body: JSON.stringify({ email, password }) });
export const fetchMe = () => request(`${AUTH}/me`);
export const setEducationLevel = (educationLevel) =>
  request(`${AUTH}/level`, { method: 'PATCH', body: JSON.stringify({ educationLevel }) });

export const listSubjects = () => request(SUBJECTS);
export const createSubject = (data) =>
  request(SUBJECTS, { method: 'POST', body: JSON.stringify(data) });
export const updateSubject = (id, data) =>
  request(`${SUBJECTS}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSubject = (id) => request(`${SUBJECTS}/${id}`, { method: 'DELETE' });
