export async function fetchJSON<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data && typeof data === "object" && "error" in data) {
        const errorMessage = (data as { error?: unknown }).error;
        if (typeof errorMessage === "string" && errorMessage.trim().length) {
          message = errorMessage;
        }
      }
    } catch {
      try {
        const fallbackText = await response.text();
        if (fallbackText.trim().length) {
          message = fallbackText;
        }
      } catch {
        // ignore secondary failure
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

