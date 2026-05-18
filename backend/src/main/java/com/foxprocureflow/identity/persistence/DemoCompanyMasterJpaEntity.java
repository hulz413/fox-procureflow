package com.foxprocureflow.identity.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "demo_companies")
public class DemoCompanyMasterJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String groupId;

    @Column(nullable = false, length = 64, unique = true)
    private String companyId;

    @Column(nullable = false, length = 128)
    private String companyName;

    @Column(nullable = false)
    private String businessScope;

    @Column(nullable = false)
    private boolean active;

    protected DemoCompanyMasterJpaEntity() {
    }

    public Long getId() {
        return id;
    }

    public String getGroupId() {
        return groupId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getBusinessScope() {
        return businessScope;
    }

    public boolean isActive() {
        return active;
    }
}
