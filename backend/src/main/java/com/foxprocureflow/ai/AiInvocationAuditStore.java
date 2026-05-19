package com.foxprocureflow.ai;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public interface AiInvocationAuditStore {

    boolean isAvailable();

    void start(
        String invocationId,
        AiScenario scenario,
        String companyId,
        String actorId,
        List<AiAssistantDtos.AiContextReference> sourceReferences,
        String inputSummary,
        Map<String, Object> sanitizedPromptContext,
        String model,
        OffsetDateTime startedAt
    );

    void complete(String invocationId, Map<String, Object> structuredOutput, long latencyMs, OffsetDateTime completedAt);

    void fail(String invocationId, String errorCode, String errorMessage, long latencyMs, OffsetDateTime completedAt);
}
