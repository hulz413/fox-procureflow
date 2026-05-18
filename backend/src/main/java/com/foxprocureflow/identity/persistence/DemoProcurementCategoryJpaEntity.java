package com.foxprocureflow.identity.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "demo_procurement_categories")
public class DemoProcurementCategoryJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String categoryId;

    @Column(nullable = false, length = 128)
    private String categoryName;

    @Column(nullable = false)
    private String businessScope;

    @Column(nullable = false)
    private boolean groupLevel;

    @Column(nullable = false)
    private int sortOrder;

    protected DemoProcurementCategoryJpaEntity() {
    }

    public String getCategoryId() {
        return categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public String getBusinessScope() {
        return businessScope;
    }

    public boolean isGroupLevel() {
        return groupLevel;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
