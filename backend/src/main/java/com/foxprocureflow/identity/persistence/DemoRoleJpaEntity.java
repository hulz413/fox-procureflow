package com.foxprocureflow.identity.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "demo_roles")
public class DemoRoleJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64, unique = true)
    private String roleId;

    @Column(nullable = false, length = 128)
    private String roleName;

    @Column(nullable = false, length = 64)
    private String roleType;

    @Column(nullable = false)
    private String description;

    protected DemoRoleJpaEntity() {
    }

    public String getRoleId() {
        return roleId;
    }

    public String getRoleName() {
        return roleName;
    }

    public String getRoleType() {
        return roleType;
    }

    public String getDescription() {
        return description;
    }
}
