const RealDate = Date

// Runs the clock from a fixed moment, so the recording day never changes the videos.
// Null restores the real clock.
export const setClock = (now: string | null) => {
  if (now === null) {
    globalThis.Date = RealDate
    return
  }
  const offset = new RealDate(now).getTime() - RealDate.now()
  const shiftedNow = () => RealDate.now() + offset

  globalThis.Date = new Proxy(RealDate, {
    construct: (target, args) =>
      args.length === 0
        ? new target(shiftedNow())
        : new (target as any)(...args),
    apply: () => new RealDate(shiftedNow()).toString(),
    get: (target, prop) =>
      prop === 'now' ? shiftedNow : Reflect.get(target, prop),
  })
}
