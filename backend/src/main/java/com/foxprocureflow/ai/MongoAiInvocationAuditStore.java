package com.foxprocureflow.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class MongoAiInvocationAuditStore implements AiInvocationAuditStore, DisposableBean {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };
    private static final String COLLECTION = "ai_invocations";

    private final ObjectProvider<MongoTemplate> mongoTemplateProvider;
    private final ObjectProvider<MongoClient> mongoClientProvider;
    private final Environment environment;
    private final ObjectMapper objectMapper;
    private volatile MongoClient ownedMongoClient;
    private volatile MongoTemplate fallbackMongoTemplate;

    public MongoAiInvocationAuditStore(
        ObjectProvider<MongoTemplate> mongoTemplateProvider,
        ObjectProvider<MongoClient> mongoClientProvider,
        Environment environment,
        ObjectMapper objectMapper
    ) {
        this.mongoTemplateProvider = mongoTemplateProvider;
        this.mongoClientProvider = mongoClientProvider;
        this.environment = environment;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean isAvailable() {
        return mongoTemplateProvider.getIfAvailable() != null || canBuildFallbackTemplate();
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
        document.put("sourceReferences", toMongoValue(sourceReferences));
        document.put("inputSummary", inputSummary);
        document.put("sanitizedPromptContext", toMongoValue(sanitizedPromptContext));
        document.put("provider", "deepseek");
        document.put("model", model);
        document.put("status", "STARTED");
        document.put("startedAt", toMongoDate(startedAt));
        document.put("createdAt", toMongoDate(startedAt));
        document.put("updatedAt", toMongoDate(startedAt));
        mongoTemplate.save(document, COLLECTION);
    }

    @Override
    public void complete(String invocationId, Map<String, Object> structuredOutput, long latencyMs, OffsetDateTime completedAt) {
        requireTemplate().updateFirst(byInvocationId(invocationId), new Update()
            .set("structuredOutput", toMongoValue(structuredOutput))
            .set("status", "SUCCEEDED")
            .set("latencyMs", latencyMs)
            .set("completedAt", toMongoDate(completedAt))
            .set("updatedAt", toMongoDate(completedAt)), COLLECTION);
    }

    @Override
    public void fail(String invocationId, String errorCode, String errorMessage, long latencyMs, OffsetDateTime completedAt) {
        requireTemplate().updateFirst(byInvocationId(invocationId), new Update()
            .set("status", "FAILED")
            .set("errorCode", errorCode)
            .set("errorMessage", errorMessage)
            .set("latencyMs", latencyMs)
            .set("completedAt", toMongoDate(completedAt))
            .set("updatedAt", toMongoDate(completedAt)), COLLECTION);
    }

    private MongoTemplate requireTemplate() {
        MongoTemplate template = mongoTemplateProvider.getIfAvailable();
        if (template != null) {
            return template;
        }

        MongoClient client = mongoClientProvider.getIfAvailable();
        String databaseName = databaseName();
        if (client != null && StringUtils.hasText(databaseName)) {
            return new MongoTemplate(client, databaseName);
        }

        MongoTemplate fallback = fallbackMongoTemplate;
        if (fallback != null) {
            return fallback;
        }

        String uri = mongoUri();
        if (!StringUtils.hasText(uri) || !StringUtils.hasText(databaseName)) {
            throw new IllegalStateException("MongoDB audit storage is unavailable");
        }

        synchronized (this) {
            if (fallbackMongoTemplate == null) {
                ownedMongoClient = MongoClients.create(uri);
                fallbackMongoTemplate = new MongoTemplate(ownedMongoClient, databaseName);
            }
            return fallbackMongoTemplate;
        }
    }

    private Query byInvocationId(String invocationId) {
        return Query.query(Criteria.where("invocationId").is(invocationId));
    }

    private String databaseName() {
        String databaseName = environment.getProperty("spring.data.mongodb.database");
        String uri = mongoUri();
        if (!StringUtils.hasText(databaseName) && StringUtils.hasText(uri)) {
            databaseName = new ConnectionString(uri).getDatabase();
        }
        return databaseName;
    }

    private boolean canBuildFallbackTemplate() {
        return StringUtils.hasText(databaseName())
            && (mongoClientProvider.getIfAvailable() != null || StringUtils.hasText(mongoUri()));
    }

    private String mongoUri() {
        return environment.getProperty("spring.data.mongodb.uri");
    }

    private Object toMongoValue(Object value) {
        if (value == null
            || value instanceof String
            || value instanceof Number
            || value instanceof Boolean) {
            return value;
        }
        if (value instanceof Enum<?> enumValue) {
            return enumValue.name();
        }
        if (value instanceof OffsetDateTime offsetDateTime) {
            return toMongoDate(offsetDateTime);
        }
        if (value instanceof Instant instant) {
            return Date.from(instant);
        }
        if (value instanceof LocalDate localDate) {
            return localDate.toString();
        }
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime.toString();
        }
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> converted = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                converted.put(String.valueOf(entry.getKey()), toMongoValue(entry.getValue()));
            }
            return converted;
        }
        if (value instanceof Collection<?> collection) {
            return collection.stream().map(this::toMongoValue).toList();
        }
        return toMongoValue(objectMapper.convertValue(value, MAP_TYPE));
    }

    private Date toMongoDate(OffsetDateTime value) {
        return Date.from(value.toInstant());
    }

    @Override
    public void destroy() {
        MongoClient client = ownedMongoClient;
        if (client != null) {
            client.close();
        }
    }
}
