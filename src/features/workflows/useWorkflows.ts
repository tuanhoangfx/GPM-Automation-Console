import { useEffect, useMemo, useState } from "react";

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
  const [workflowTablePage, setWorkflowTablePage] = useState(1);
  const [workflowTablePageSize, setWorkflowTablePageSize] = useState(100);

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

  const workflowTableTotalPages = Math.max(1, Math.ceil(filteredWorkflows.length / workflowTablePageSize));
  const workflowTablePageStart = (workflowTablePage - 1) * workflowTablePageSize;
  const workflowTablePageEnd = Math.min(workflowTablePageStart + workflowTablePageSize, filteredWorkflows.length);
  const pagedFilteredWorkflows = useMemo(
    () => filteredWorkflows.slice(workflowTablePageStart, workflowTablePageEnd),
    [filteredWorkflows, workflowTablePageStart, workflowTablePageEnd]
  );

  useEffect(() => {
    if (workflowTablePage > workflowTableTotalPages) {
      setWorkflowTablePage(workflowTableTotalPages);
    }
  }, [workflowTablePage, workflowTableTotalPages]);

  useEffect(() => {
    setWorkflowTablePage(1);
  }, [workflowSearch, workflowGroupFilters, workflowPlatformFilters, workflowTablePageSize]);

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
    pagedFilteredWorkflows,
    workflowTablePage,
    setWorkflowTablePage,
    workflowTablePageSize,
    setWorkflowTablePageSize,
    workflowTableTotalPages,
    workflowTablePageStart,
    workflowTablePageEnd,
    selectedWorkflowCount,
    visibleWorkflowSteps
  };
}
