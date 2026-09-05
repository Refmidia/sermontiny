export function asFormAction(fn: (formData: FormData) => Promise<unknown>) {
  return async (formData: FormData): Promise<void> => {
    await fn(formData);
  };
}

export function asVoidAction(fn: () => Promise<unknown>) {
  return async (): Promise<void> => {
    await fn();
  };
}
