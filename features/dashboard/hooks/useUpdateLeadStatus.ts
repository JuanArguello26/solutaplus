import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLeadStatus } from "../services/leads-admin-client";

export function useUpdateLeadStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { newStatus: string; comment?: string }) =>
      updateLeadStatus(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(["lead", id], data);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
