package com.foxprocureflow.identity.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoBudgetAccountRepository extends JpaRepository<DemoBudgetAccountJpaEntity, Long> {

    List<DemoBudgetAccountJpaEntity> findByCompanyIdOrderBySortOrderAsc(String companyId);
}
