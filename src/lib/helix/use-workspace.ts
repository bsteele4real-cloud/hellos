import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMemory,
  combineSkills,
  compactMemory,
  generateSkill,
  getWorkspace,
  logEvent,
  probeConnector,
  runInit,
  togglePolicy,
  toggleSkill,
  writeDailyReport,
  type Workspace,
} from "@/lib/fns/workspace";
import { withPolicyFlag } from "@/lib/helix/governance";
import { queryClient } from "@/lib/query";

export const WORKSPACE_KEY = ["helix-workspace"] as const;

export function useWorkspace(enabled: boolean) {
  return useQuery({
    queryKey: WORKSPACE_KEY,
    queryFn: () => getWorkspace(),
    enabled,
  });
}

function cacheWorkspace(ws: Workspace) {
  queryClient.setQueryData(WORKSPACE_KEY, ws);
}

function useWsMutation<TArgs = void>(fn: (args: TArgs) => Promise<Workspace>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (ws) => {
      qc.setQueryData(WORKSPACE_KEY, ws);
    },
  });
}

export function useHelixActions() {
  const init = useWsMutation(() => runInit());
  const compact = useMutation({
    mutationFn: () => compactMemory(),
    onSuccess: (result) => cacheWorkspace(result.workspace),
  });
  const log = useWsMutation(
    (input: { kind: "action" | "mistake"; label: string; detail?: string }) =>
      logEvent({ data: input }),
  );
  const memory = useWsMutation((input: { title: string; body: string; tags: string }) =>
    addMemory({ data: input }),
  );
  const skill = useWsMutation((input: { slug: string; installed: boolean }) =>
    toggleSkill({ data: input }),
  );
  const policy = useMutation({
    mutationFn: (input: { slug: string; enabled: boolean }) => togglePolicy({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: WORKSPACE_KEY });
      const previous = queryClient.getQueryData<Workspace>(WORKSPACE_KEY);
      if (previous) {
        queryClient.setQueryData<Workspace>(WORKSPACE_KEY, {
          ...previous,
          policies: withPolicyFlag(previous.policies, input.slug, input.enabled),
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(WORKSPACE_KEY, context.previous);
    },
    onSuccess: (ws) => {
      queryClient.setQueryData(WORKSPACE_KEY, ws);
    },
  });
  const report = useWsMutation(() => writeDailyReport());
  const combo = useMutation({
    mutationFn: (input: { name: string; slugs: string[] }) => combineSkills({ data: input }),
    onSuccess: (result) => cacheWorkspace(result.workspace),
  });
  const generate = useMutation({
    mutationFn: (input: {
      name: string;
      brief: string;
      target: string;
      slugs: string[];
      confirmDestructive?: boolean;
      draftProtocol?: string;
      draftScript?: string;
    }) => generateSkill({ data: input }),
    onSuccess: (result) => cacheWorkspace(result.workspace),
  });
  const probe = useMutation({
    mutationFn: (provider: string) => probeConnector({ data: { provider } }),
    onSuccess: (result) => cacheWorkspace(result.workspace),
  });

  return { init, compact, log, memory, skill, policy, report, combo, generate, probe };
}
