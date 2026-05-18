package com.foxprocureflow.identity.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "demo_users")
public class DemoUserJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64)
    private String departmentId;

    @Column(nullable = false, length = 64, unique = true)
    private String userId;

    @Column(nullable = false, length = 128)
    private String displayName;

    @Column(nullable = false, length = 160, unique = true)
    private String email;

    @Column(nullable = false, length = 128)
    private String positionTitle;

    @Column(nullable = false)
    private boolean active;

    protected DemoUserJpaEntity() {
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public String getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEmail() {
        return email;
    }

    public String getPositionTitle() {
        return positionTitle;
    }

    public boolean isActive() {
        return active;
    }
}
