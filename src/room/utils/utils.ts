export const partition = <T>(
  arr: T[],
  filter: (...args: T[]) => boolean
): [T[], T[]] => {
  return arr.reduce(
    (r, e, i, a) => {
      //@ts-ignore
      r[filter(e, i, a) ? 0 : 1].push(e);
      return r;
    },
    [[], []]
  );
};

export const truncateString = (str: string = "", maxLength: number): string => {
  return str.length <= maxLength ? str : str.slice(0, maxLength - 3) + "...";
};

export const getRandomInt = (max: number): number => {
  return Math.floor(Math.random() * max);
};

export const leftpad = (val: number): string => {
  return val < 10 ? `0${val}` : `${val}`;
};

export const addPlus = (val: number): string => {
  return val > 0 ? `+${val}` : `${val}`;
};

export const truncateName = (name: string): string => {
  const MAX_NAME_LENGTH = 15;
  return truncateString(name, MAX_NAME_LENGTH);
};

/**
 * Round a number
 * @param {number} precision Amount of decimal points, default 0
 */
export const round = (value: number, precision: number = 0): number => {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * Provides the correct plural of a string, depending on the amount of items
 */
export const plural = (n: number, singular: string, plural: string): string => {
  return `${n} ${n === 1 ? singular : plural}`;
};

/**
 * Convert seconds to minutes, rounded to two decimal points
 */
export const secToMin = (seconds: number): number => {
  return round(seconds / 60, 2);
};

export const hexToAscii = (str: string): string => {
  let strOut = "";
  for (let x = 0; x < str.length; x += 2)
    strOut += String.fromCharCode(parseInt(str.substr(x, 2), 16));

  return strOut;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Formats a percentage
 * @param percentage Number between 0 and 1
 * @param precision? Precision for rounding
 */
export const formatPercent = (
  percentage: number,
  precision: number = 0
): string => {
  return `${round(percentage * 100, precision)}%`;
};

export const toPercentString = (portion: number, total: number): string => {
  return toPercent(portion, total) + "%";
};

export const toPercent = (portion: number, total: number): number => {
  const percent = Math.round((portion / total) * 100);
  return Number.isNaN(percent) ? 0 : percent;
};

export const inRange = (num: number, rangeMin: number, rangeMax: number) => {
  if (rangeMin >= rangeMax) throw new Error("Invalid range");

  return num >= rangeMin && num <= rangeMax;
};

export const isInRectangleArea = (
  { x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number },
  { x, y }: { x: number; y: number }
): boolean => {
  return x > x1 && x < x2 && y > y1 && y < y2;
};

/**
 * Get date and time formatted i.e November 3rd 2019, 9:05 PM
 * @param dateTime Date.now()
 */
export const formatDateAndTime = (dateTime: number = Date.now()): string => {
  const dateStringFull = formatDate(dateTime);
  const timeString = formatTime(dateTime);
  return `${dateStringFull} ${timeString}`;
};

/**
 * Get date formatted i.e November 3rd 2019
 */
export const formatDate = (dateTime: number = Date.now()): string => {
  return new Date(dateTime).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Chicago",
  });
};

/**
 * Get time formatted HH:MM AM/PM
 */
export const formatTime = (dateTime: number = Date.now()): string => {
  const date = new Date(dateTime);
  let hours = date.getHours();
  let minutes: string | number = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  const strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
};

/**
 * Escape RegExp characters
 */
export const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

/**
 * Return a random item from an array
 */
export const randFromArray = <T>(arr: T[]): T => {
  // "~~" for a closest "int"
  return arr[~~(arr.length * Math.random())];
};

export const containsNWord = (msg: string) => {
  msg = msg.toLowerCase();
  // const regExpTest = new RegExp(
  //   /(n|i){1,32}((g{2,32}|q){1,32}|[gq]{2,32})[e3r]{1,32}/,
  //   "i"
  // ).test(msg);
  // const wordTest = new RegExp(
  //   /(?:nigg|niqa|niqqa|n!ga|n1g|niig|niiq)/,
  //   "i"
  // ).test(msg);

  // return regExpTest || wordTest;

  const filters = ["nig", "nigger", "n1gger", "n1gg3r", "niger", "n1g3r"];

  const isOffensive = filters.some((filterWord) => msg.includes(filterWord));

  return isOffensive;
};

export const sumObjectValues = (object: { [key: string | number]: number }) => {
  const objKeys = Object.values(object);
  return objKeys.reduce((acc, curr) => acc + curr);
};

export const isObject = (obj: any) => {
  return obj != null && obj.constructor.name === "Object";
};
