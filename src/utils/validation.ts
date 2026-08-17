export function assertTrue(condition: boolean, message = 'Assertion failed'): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertDefined<T>(value: T | null | undefined, message = 'Value is null or undefined'): T {
  if (value == null) {
    throw new Error(message);
  }
  return value;
}
