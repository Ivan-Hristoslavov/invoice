import { useCallback, useState } from "react";

type UseWizardStepOptions = {
  maxStep: number;
  initialStep?: number;
};

export function useWizardStep({ maxStep, initialStep = 0 }: UseWizardStepOptions) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const next = useCallback(() => {
    setCurrentStep((s) => Math.min(maxStep, s + 1));
  }, [maxStep]);

  const back = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const goTo = useCallback(
    (step: number) => {
      setCurrentStep(Math.max(0, Math.min(maxStep, step)));
    },
    [maxStep]
  );

  return { currentStep, setCurrentStep, next, back, goTo, isFirst: currentStep === 0, isLast: currentStep >= maxStep };
}
