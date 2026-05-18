package com.foxprocureflow.identity;

import java.util.List;

public record DemoOrganizationContext(
    String groupId,
    String groupName,
    DemoCompanyContext activeCompany,
    List<DemoCompanyContext> companies,
    String supplierPoolScope,
    DataBoundary dataBoundary
) {

    public record DataBoundary(
        String groupShared,
        String companyIsolated
    ) {
    }
}
