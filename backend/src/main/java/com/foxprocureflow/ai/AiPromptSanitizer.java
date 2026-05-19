package com.foxprocureflow.ai;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class AiPromptSanitizer {

    private static final Pattern EMAIL = Pattern.compile("[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}", Pattern.CASE_INSENSITIVE);
    private static final Pattern PHONE = Pattern.compile("(?<!\\d)(?:\\+?86[- ]?)?1[3-9]\\d{9}(?!\\d)");
    private static final List<String> SENSITIVE_KEY_PARTS = List.of(
        "apikey",
        "api_key",
        "secret",
        "password",
        "token",
        "stacktrace",
        "email",
        "phone",
        "mobile");

    @SuppressWarnings("unchecked")
    public Map<String, Object> sanitize(Map<String, Object> value) {
        return (Map<String, Object>) sanitizeValue(value);
    }

    private Object sanitizeValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> sanitized = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                String key = String.valueOf(entry.getKey());
                if (isSensitiveKey(key)) {
                    continue;
                }
                sanitized.put(key, sanitizeValue(entry.getValue()));
            }
            return sanitized;
        }
        if (value instanceof Collection<?> collection) {
            return collection.stream().map(this::sanitizeValue).toList();
        }
        if (value instanceof String text) {
            return PHONE.matcher(EMAIL.matcher(text).replaceAll("[redacted-email]")).replaceAll("[redacted-phone]");
        }
        return value;
    }

    private boolean isSensitiveKey(String key) {
        String normalized = key.replace("-", "").replace("_", "").toLowerCase();
        return SENSITIVE_KEY_PARTS.stream()
            .map(part -> part.replace("_", ""))
            .anyMatch(normalized::contains);
    }
}
