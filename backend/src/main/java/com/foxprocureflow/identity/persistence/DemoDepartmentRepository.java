package com.foxprocureflow.identity.persistence;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoDepartmentRepository extends JpaRepository<DemoDepartmentJpaEntity, Long> {

    List<DemoDepartmentJpaEntity> findByCompanyIdOrderBySortOrderAsc(String companyId);

    Optional<DemoDepartmentJpaEntity> findByDepartmentId(String departmentId);
}
