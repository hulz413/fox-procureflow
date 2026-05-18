package com.foxprocureflow.identity;

public record DemoCompanyContext(
    String companyId,
    String companyName,
    String businessScope,
    boolean active
) {
}
