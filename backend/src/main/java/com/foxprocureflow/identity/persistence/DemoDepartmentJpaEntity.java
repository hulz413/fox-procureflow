package com.foxprocureflow.identity.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "demo_departments")
public class DemoDepartmentJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64, unique = true)
    private String departmentId;

    @Column(nullable = false, length = 128)
    private String departmentName;

    @Column(nullable = false)
    private String functionScope;

    @Column(nullable = false)
    private int sortOrder;

    protected DemoDepartmentJpaEntity() {
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public String getFunctionScope() {
        return functionScope;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
