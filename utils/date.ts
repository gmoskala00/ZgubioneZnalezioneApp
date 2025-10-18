import dayjs from "dayjs";
import "dayjs/locale/pl.js";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.locale("pl");

dayjs.tz.setDefault("Europe/Warsaw");

export const formatDateTimePL = (d: string | Date) =>
  dayjs(d).tz().format("D MMMM YYYY HH:mm");

export const formatDatePL = (d: string | Date) =>
  dayjs(d).tz().format("DD.MM.YYYY");

export const toIsoUtc = (d: Date) => dayjs(d).utc().toISOString();
