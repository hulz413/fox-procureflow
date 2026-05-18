package com.foxprocureflow.identity.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "demo_supplier_categories")
public class DemoSupplierCategoryJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String supplierId;

    @Column(nullable = false, length = 64)
    private String categoryId;

    protected DemoSupplierCategoryJpaEntity() {
    }

    public String getSupplierId() {
        return supplierId;
    }

    public String getCategoryId() {
        return categoryId;
    }
}
