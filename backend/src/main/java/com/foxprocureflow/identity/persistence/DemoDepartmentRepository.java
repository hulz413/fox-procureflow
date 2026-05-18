package com.foxprocureflow.identity.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoDepartmentRepository extends JpaRepository<DemoDepartmentJpaEntity, Long> {

    List<DemoDepartmentJpaEntity> findByCompanyIdOrderBySortOrderAsc(String companyId);
}
