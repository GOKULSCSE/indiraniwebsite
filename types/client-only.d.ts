declare module 'client-only' {
  function clientOnly<T>(fn: () => T): T;
  export default clientOnly;
} 