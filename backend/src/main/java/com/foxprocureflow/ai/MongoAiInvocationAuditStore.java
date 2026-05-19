package com.foxprocureflow.ai;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

@Component
public class MongoAiInvocationAuditStore implements AiInvocationAuditStore {

    private static final String COLLECTION = "ai_invocations";

    private final ObjectProvider<MongoTemplate> mongoTemplateProvider;

    public MongoAiInvocationAuditStore(ObjectProvider<MongoTemplate> mongoTemplateProvider) {
        this.mongoTemplateProvider = mongoTemplateProvider;
    }

    @Override
    public boolean isAvailable() {
        return mongoTemplateProvider.getIfAvailable() != null;
    }

    @Override
    public void start(
        String invocationId,
        AiScenario scenario,
        String companyId,
        String actorId,
        List<AiAssistantDtos.AiContextReference> sourceReferences,
        String inputSummary,
        Map<String, Object> sanitizedPromptContext,
        String model,
        OffsetDateTime startedAt
    ) {
        MongoTemplate mongoTemplate = requireTemplate();
        Map<String, Object> document = new LinkedHashMap<>();
        document.put("_id", invocationId);
        document.put("invocationId", invocationId);
        document.put("scenario", scenario.name());
        document.put("companyId", companyId);
        document.put("actorId", actorId);
        document.put("sourceReferences", sourceReferences);
        document.put("inputSummary", inputSummary);
        document.put("sanitizedPromptContext", sanitizedPromptContext);
        document.put("provider", "deepseek");
        document.put("model", model);
        document.put("status", "STARTED");
        document.put("startedAt", startedAt);
        document.put("createdAt", startedAt);
        document.put("updatedAt", startedAt);
        mongoTemplate.save(document, COLLECTION);
    }

    @Override
    public void complete(String invocationId, Map<String, Object> structuredOutput, long latencyMs, OffsetDateTime completedAt) {
        requireTemplate().updateFirst(byInvocationId(invocationId), new Update()
            .set("structuredOutput", structuredOutput)
            .set("status", "SUCCEEDED")
            .set("latencyMs", latencyMs)
            .set("completedAt", completedAt)
            .set("updatedAt", completedAt), COLLECTION);
    }

    @Override
    public void fail(String invocationId, String errorCode, String errorMessage, long latencyMs, OffsetDateTime completedAt) {
        requireTemplate().updateFirst(byInvocationId(invocationId), new Update()
            .set("status", "FAILED")
            .set("errorCode", errorCode)
            .set("errorMessage", errorMessage)
            .set("latencyMs", latencyMs)
            .set("completedAt", completedAt)
            .set("updatedAt", completedAt), COLLECTION);
    }

    private MongoTemplate requireTemplate() {
        MongoTemplate template = mongoTemplateProvider.getIfAvailable();
        if (template == null) {
            throw new IllegalStateException("MongoDB audit storage is unavailable");
        }
        return template;
    }

    private Query byInvocationId(String invocationId) {
        return Query.query(Criteria.where("invocationId").is(invocationId));
    }
}
