import axios from "axios";
import type { AxiosResponse } from "axios";
import toast from "react-hot-toast";

export type StateSetter<T> = ((value: T) => void) | undefined;

type ApiEnvelope<T> = {
  data?: T;
  error?: string;
  message?: string;
};

export function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiEnvelope<unknown> | undefined;
    return payload?.error || payload?.message || error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

export function applyState<T>(stateSetter: StateSetter<T>, value: T): T {
  stateSetter?.(value);
  return value;
}

export async function resolveApiData<T>(
  request: Promise<AxiosResponse<ApiEnvelope<T>>>,
  options: {
    fallbackMessage: string;
    fallbackValue: T;
    stateSetter?: StateSetter<T>;
    showToast?: boolean;
  },
): Promise<T> {
  try {
    const response = await request;
    const value = response.data?.data ?? options.fallbackValue;
    return applyState(options.stateSetter, value);
  } catch (error) {
    if (options.showToast !== false) {
      toast.error(getErrorMessage(error, options.fallbackMessage));
    }

    return applyState(options.stateSetter, options.fallbackValue);
  }
}
