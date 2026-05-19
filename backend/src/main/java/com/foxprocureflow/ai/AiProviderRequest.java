package com.foxprocureflow.ai;

public record AiProviderRequest(
    AiScenario scenario,
    String systemPrompt,
    String userPrompt
) {
}
