package com.foxprocureflow.identity.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "demo_suppliers")
public class DemoSupplierJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String supplierId;

    @Column(nullable = false, length = 160)
    private String supplierName;

    @Column(nullable = false)
    private String serviceScope;

    @Column(nullable = false, length = 128)
    private String location;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(nullable = false, length = 32)
    private String riskLevel;

    @Column(nullable = false, length = 64)
    private String sharedScope;

    protected DemoSupplierJpaEntity() {
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

    public String getStatus() {
        return status;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public String getSharedScope() {
        return sharedScope;
    }
}
