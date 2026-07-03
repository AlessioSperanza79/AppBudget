export const generaId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
