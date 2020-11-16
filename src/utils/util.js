export const secondToHms = (second) => {
  second = Number(second);
  const h = Math.floor(second / 3600);
  const m = Math.floor((second % 3600) / 60);
  const s = Math.floor((second % 3600) % 60);

  const result = [h, m, s]
    .map((time) => (time < 10 ? `0${time}` : `${time}`))
    .join(":");

  return result;
};
