export type VariableType = 'secret' | 'variable' | 'metric';
export type SystemType = 'config' | 'storage';

/** Resource kinds that own variables, as used in API path prefixes. */
export type VariableResourceType = 'workspaces' | 'projects' | 'services';

export interface VariableSummary {
  id: string;
  key: string;
  value: string;
  type: VariableType;
  systemType?: SystemType | null;
  createdAt: string;
  updatedAt: string;
}

/** A platform-computed, read-only variable (e.g. `$s.name`). */
export interface LockedVariable {
  key: string;
  value: string;
  description: string;
}

/** Scope levels of a resource's variable hierarchy. */
export type VariableScopeName = 'service' | 'project' | 'workspace' | 'org';

/** One inherited scope layer: a resource's stored + locked variables. */
export interface VariableScope {
  scope: VariableScopeName;
  prefix: string;
  resourceId: string;
  resourceName: string;
  /** True only for the requested resource — ancestors are read-only. */
  editable: boolean;
  variables: VariableSummary[];
  locked: LockedVariable[];
}

/** Full inherited hierarchy for a resource, most-specific scope first. */
export interface VariableHierarchyResponse {
  scopes: VariableScope[];
}

export interface CreateVariableRequest {
  key: string;
  value: string;
  type: VariableType;
}

export interface UpdateVariableRequest {
  value: string;
}
