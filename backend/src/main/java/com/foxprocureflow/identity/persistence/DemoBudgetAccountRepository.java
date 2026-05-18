package com.foxprocureflow.identity.persistence;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoBudgetAccountRepository extends JpaRepository<DemoBudgetAccountJpaEntity, Long> {

    List<DemoBudgetAccountJpaEntity> findByCompanyIdOrderBySortOrderAsc(String companyId);

    Optional<DemoBudgetAccountJpaEntity> findByBudgetAccountId(String budgetAccountId);
}
