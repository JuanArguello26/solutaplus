"use client";

import { useMutation } from "@tanstack/react-query";
import { submitLead } from "../services/lead-client";

export function useCreateLead() {
  return useMutation({ mutationFn: submitLead });
}
