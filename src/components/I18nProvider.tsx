"use client";

import { PropsWithChildren } from "react";
import "@/i18n/client";

export function I18nProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}
