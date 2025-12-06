export type HttpMetricLabels = {
  method: string;
  route: string;
  status: string;
};

export type ApprovalStatusCount = {
  status: string;
  count: number;
};

export type ProviderHealthSnapshot = {
  providerId: string;
  provider: string;
  workspaceId: string;
  isValid: boolean;
};
