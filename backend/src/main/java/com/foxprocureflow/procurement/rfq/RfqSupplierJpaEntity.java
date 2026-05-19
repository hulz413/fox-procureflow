package com.foxprocureflow.procurement.rfq;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "rfq_suppliers")
public class RfqSupplierJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String rfqId;

    @Column(nullable = false, length = 64)
    private String supplierId;

    @Column(nullable = false, length = 160)
    private String supplierName;

    @Column(nullable = false)
    private String serviceScope;

    @Column(nullable = false, length = 128)
    private String location;

    @Column(nullable = false, length = 32)
    private String riskLevel;

    @Column(nullable = false, length = 64)
    private String sharedScope;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RfqSupplierStatus status;

    @Column(nullable = false, columnDefinition = "JSON")
    private String categoryCoverageJson;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected RfqSupplierJpaEntity() {
    }

    RfqSupplierJpaEntity(
        String rfqId,
        String supplierId,
        String supplierName,
        String serviceScope,
        String location,
        String riskLevel,
        String sharedScope,
        String categoryCoverageJson
    ) {
        this.rfqId = rfqId;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.serviceScope = serviceScope;
        this.location = location;
        this.riskLevel = riskLevel;
        this.sharedScope = sharedScope;
        this.status = RfqSupplierStatus.INVITED;
        this.categoryCoverageJson = categoryCoverageJson;
        this.createdAt = LocalDateTime.now();
    }

    public String getRfqId() {
        return rfqId;
    }

    public String getSupplierId() {
        return supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public String getServiceScope() {
        return serviceScope;
    }

    public String getLocation() {
        return location;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public String getSharedScope() {
        return sharedScope;
    }

    public RfqSupplierStatus getStatus() {
        return status;
    }

    public String getCategoryCoverageJson() {
        return categoryCoverageJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
