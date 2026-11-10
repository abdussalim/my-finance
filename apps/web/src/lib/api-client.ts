export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || "Terjadi kesalahan pada server");
  }

  return json.data as T;
}
