export interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  repository: {
    name: string;
    owner: string;
    fullName: string;
  };
  branch: string;
  event: string;
  createdAt: string;
  updatedAt: string;
  runStartedAt?: string | null;
  htmlUrl: string;
  runNumber: number;
  headSha?: string;
}

export interface BatchMetadata {
  dateFrom: string;
  dateTo: string;
  loadedAt: number;
  workflowCount: number;
}

export interface WorkflowCache {
  version: string;
  data: WorkflowRun[];
  timestamp: number;
  batches: {
    [batchId: string]: BatchMetadata;
  };
}
