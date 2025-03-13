export function nativeTryCatch(fn, errorFn) {
  try {
    fn();
  } catch (error) {
    errorFn && errorFn(error);
  }
}
