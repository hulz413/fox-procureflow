package com.foxprocureflow.dashboard;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class ProcurementDashboardDtos {

    private ProcurementDashboardDtos() {
    }

    public record ProcurementDashboardResponse(
        ProcurementDashboardScope scope,
        String groupId,
        String groupName,
        String companyId,
        String companyName,
        List<String> companyIds,
        LocalDateTime generatedAt,
        List<DashboardMetric> summary,
        List<SpendTrendPoint> spendTrend,
        List<DocumentFunnelStage> documentFunnel,
        List<StatusDistributionBucket> statusDistributions,
        List<SupplierDistributionItem> supplierDistribution,
        List<ExceptionHighlight> exceptionHighlights
    ) {
    }

    public record DashboardMetric(
        String key,
        String label,
        BigDecimal value,
        String currency,
        LocalDateTime generatedAt
    ) {
    }

    public record SpendTrendPoint(
        String period,
        BigDecimal amount,
        String currency,
        long documentCount
    ) {
    }

    public record DocumentFunnelStage(
        String key,
        String label,
        long count
    ) {
    }

    public record StatusDistributionBucket(
        String documentType,
        String documentLabel,
        String status,
        String label,
        long count
    ) {
    }

    public record SupplierDistributionItem(
        String supplierId,
        String supplierName,
        BigDecimal issuedPoAmount,
        String currency,
        long issuedPoCount,
        long quoteCount
    ) {
    }

    public record ExceptionHighlight(
        String matchId,
        String companyId,
        String companyName,
        String poId,
        String poTitle,
        String supplierId,
        String supplierName,
        String severity,
        BigDecimal invoiceVarianceAmount,
        String currency,
        LocalDateTime lastCalculatedAt
    ) {
    }
}
