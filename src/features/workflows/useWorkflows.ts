import { useMemo, useState } from "react";

type WorkflowLike = {
  id: string;
  name: string;
  description: string;
  group: string;
  steps: unknown[];
};

type Option = { value: string; label: string };

export function useWorkflows<TWorkflow extends WorkflowLike>(
  workflowConfigs: TWorkflow[],
  selectedWorkflowIds: string[],
  workflowDisplayId: (id: string) => string,
  workflowDisplayPlatform: (workflow: TWorkflow) => string
) {
  const [workflowSearch, setWorkflowSearch] = useState("");
  const [workflowGroupFilters, setWorkflowGroupFilters] = useState<string[]>([]);
  const [workflowPlatformFilters, setWorkflowPlatformFilters] = useState<string[]>([]);

  const selectedWorkflowConfigs = useMemo(
    () => selectedWorkflowIds.map((id) => workflowConfigs.find((workflow) => workflow.id === id)).filter(Boolean) as TWorkflow[],
    [selectedWorkflowIds, workflowConfigs]
  );

  const workflowGroups = useMemo(() => Array.from(new Set(workflowConfigs.map((workflow) => workflow.group))), [workflowConfigs]);
  const workflowPlatforms = useMemo(() => Array.from(new Set(workflowConfigs.map(workflowDisplayPlatform))), [workflowConfigs, workflowDisplayPlatform]);
  const workflowGroupOptions = useMemo<Option[]>(
    () => workflowGroups.map((group) => ({ value: group, label: group })),
    [workflowGroups]
  );
  const workflowPlatformOptions = useMemo<Option[]>(
    () => workflowPlatforms.map((platform) => ({ value: platform, label: platform })),
    [workflowPlatforms]
  );

  const filteredWorkflows = useMemo(() => {
    const term = workflowSearch.trim().toLowerCase();
    return workflowConfigs.filter((workflow) => {
      const displayId = workflowDisplayId(workflow.id).toLowerCase();
      const displayPlatform = workflowDisplayPlatform(workflow);
      const matchesTerm =
        !term ||
        displayId.includes(term) ||
        workflow.id.toLowerCase().includes(term) ||
        workflow.name.toLowerCase().includes(term) ||
        workflow.description.toLowerCase().includes(term) ||
        displayPlatform.toLowerCase().includes(term) ||
        workflow.group.toLowerCase().includes(term);
      const matchesGroup = workflowGroupFilters.length === 0 || workflowGroupFilters.includes(workflow.group);
      const matchesPlatform = workflowPlatformFilters.length === 0 || workflowPlatformFilters.includes(displayPlatform);
      return matchesTerm && matchesGroup && matchesPlatform;
    });
  }, [workflowConfigs, workflowDisplayId, workflowDisplayPlatform, workflowGroupFilters, workflowPlatformFilters, workflowSearch]);

  const selectedWorkflowCount = selectedWorkflowIds.length;
  const visibleWorkflowSteps = filteredWorkflows.reduce((count, workflow) => count + workflow.steps.length, 0);

  return {
    workflowSearch,
    setWorkflowSearch,
    workflowGroupFilters,
    setWorkflowGroupFilters,
    workflowPlatformFilters,
    setWorkflowPlatformFilters,
    selectedWorkflowConfigs,
    workflowGroupOptions,
    workflowPlatformOptions,
    filteredWorkflows,
    selectedWorkflowCount,
    visibleWorkflowSteps
  };
}
