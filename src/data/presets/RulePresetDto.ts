export type RulePresetScope = 'org' | 'workspace';

/** One script preset from the Preset Library (GET /rule-presets). */
export interface RulePresetSummary {
  id: string;
  name: string;
  script: string;
  scope: RulePresetScope;
}

/** Request of POST /rule-presets. */
export interface CreateRulePresetRequest {
  name: string;
  script: string;
  workspaceId?: string;
}
