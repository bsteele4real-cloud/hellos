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
  const policy = useWsMutation((input: { slug: string; enabled: boolean }) =>
    togglePolicy({ data: input }),
  );
  const report = useWsMutation(() => writeDailyReport());
  const combo = useWsMutation((input: { name: string; slugs: string[] }) =>
    combineSkills({ data: input }),
  );
  const generate = useMutation({
    mutationFn: (input: {
      name: string;
      brief: string;
      target: string;
      slugs: string[];
    }) => generateSkill({ data: input }),
    onSuccess: (result) => cacheWorkspace(result.workspace),
  });
  const probe = useMutation({
    mutationFn: (provider: string) => probeConnector({ data: { provider } }),
    onSuccess: (result) => cacheWorkspace(result.workspace),
  });

  return { init, compact, log, memory, skill, policy, report, combo, generate, probe };
}
