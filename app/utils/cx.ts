import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// use clsx & tailwind-merge
export default function cx(...args: any[]) {
  return twMerge(clsx(...args));
}
