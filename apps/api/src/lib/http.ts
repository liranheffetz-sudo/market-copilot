export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {})
    },
    signal: AbortSignal.timeout(12_000)
  });

  if (!response.ok) {
    throw new HttpError(`Upstream request failed with status ${response.status}`, response.status);
  }

  return (await response.json()) as T;
};
