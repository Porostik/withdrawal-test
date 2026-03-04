export type ApiErrorCode =
  | "conflict"
  | "network"
  | "unknown"
  | "bad_request"
  | "not_found"
  | "unauthorized";

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export async function requestJSON<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const credentials = init?.credentials ?? "include";
  let response: Response;
  try {
    response = await fetch(input, { ...init, credentials });
  } catch {
    throw new ApiError("network");
  }

  if (response.status === 409) {
    throw new ApiError("conflict");
  }
  if (response.status === 400) {
    let message: string | undefined;
    try {
      const body = await response.json();
      if (typeof body?.message === "string") message = body.message;
    } catch {
      // ignore
    }
    throw new ApiError("bad_request", message);
  }
  if (response.status === 404) {
    throw new ApiError("not_found");
  }
  if (response.status === 401) {
    let message: string | undefined;
    try {
      const body = await response.json();
      if (typeof body?.message === "string") message = body.message;
    } catch {
      // ignore
    }
    throw new ApiError("unauthorized", message);
  }
  if (!response.ok) {
    throw new ApiError("unknown");
  }

  return response.json() as Promise<T>;
}
