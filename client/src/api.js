const BASE = '/api/subjects';

async function request(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = `Lỗi ${res.status}`;
    try {
      const body = await res.json();
      if (body.errors) message = body.errors.join(', ');
      else if (body.error) message = body.error;
    } catch {
      // response has no JSON body
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

export const listSubjects = () => request(BASE);
export const createSubject = (data) =>
  request(BASE, { method: 'POST', body: JSON.stringify(data) });
export const updateSubject = (id, data) =>
  request(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSubject = (id) => request(`${BASE}/${id}`, { method: 'DELETE' });
