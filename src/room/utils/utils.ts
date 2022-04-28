export const partition = <T>(arr: T[], filter: (...T) => boolean) =>
  arr.reduce(
    (r, e, i, a) => {
      r[filter(e, i, a) ? 0 : 1].push(e);
      return r;
    },
    [[], []]
  );
