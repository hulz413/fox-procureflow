package com.foxprocureflow.search;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class GlobalSearchDtos {

    private GlobalSearchDtos() {
    }

    public record GlobalSearchResponse(
        String query,
        String companyId,
        String companyName,
        LocalDateTime generatedAt,
        List<GlobalSearchGroupResponse> groups
    ) {
    }

    public record GlobalSearchGroupResponse(
        GlobalSearchResultType type,
        String label,
        List<GlobalSearchResultResponse> results
    ) {
    }

    public record GlobalSearchResultResponse(
        GlobalSearchResultType type,
        String id,
        String title,
        String subtitle,
        String status,
        String companyId,
        String companyName,
        String supplierName,
        BigDecimal amount,
        String currency,
        String ownershipScope,
        List<String> matchedFields,
        String targetPath,
        Map<String, String> targetParams,
        LocalDateTime occurredAt
    ) {
    }
}
