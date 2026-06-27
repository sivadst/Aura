import { prisma } from "@/lib/prisma";

interface ModelConfig {
  modelId: string;
  isFineTuned: boolean;
  weight: number; // For A/B testing (0-1)
}

export async function getActiveModel(organizationId: string): Promise<ModelConfig> {
  const settings = await prisma.settings.findUnique({
    where: { orgId: organizationId },
  });

  // Check if fine-tuned model is ready
  if (settings?.fineTunedModelId && settings?.fineTunedModelEnabled) {
    // 50/50 A/B test: base vs fine-tuned
    const useFineTuned = Math.random() < (settings.fineTunedModelWeight || 0.5);
    
    if (useFineTuned) {
      return {
        modelId: settings.fineTunedModelId,
        isFineTuned: true,
        weight: settings.fineTunedModelWeight || 0.5,
      };
    }
  }

  return {
    modelId: "gpt-4o-mini",
    isFineTuned: false,
    weight: 1 - (settings?.fineTunedModelWeight || 0.5),
  };
}

// Update settings with new fine-tuned model
export async function registerFineTunedModel(
  organizationId: string,
  modelId: string
) {
  return prisma.settings.update({
    where: { orgId: organizationId },
    data: {
      fineTunedModelId: modelId,
      fineTunedModelWeight: 0.5, // Start with 50% traffic
      fineTunedModelEnabled: true,
    },
  });
}
