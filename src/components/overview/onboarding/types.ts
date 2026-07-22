export type OnboardingRoute = 'scrape' | 'upload' | 'questions';
export type OnboardingStepStatus = 'pending' | 'running' | 'done' | 'failed';
export type OnboardingRouteResult = {
  route: OnboardingRoute;
  status: OnboardingStepStatus;
  message?: string;
  count?: number;
};
