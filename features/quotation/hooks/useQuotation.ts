"use client";

import { useMutation } from "@tanstack/react-query";
import { requestQuotation } from "../services/quotation-client";

export function useQuotation() {
  return useMutation({ mutationFn: requestQuotation });
}
