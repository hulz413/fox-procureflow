package com.foxprocureflow.procurement.approval;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalRuleRepository extends JpaRepository<ApprovalRuleJpaEntity, Long> {

    List<ApprovalRuleJpaEntity> findByCompanyIdAndActiveTrueOrderByPriorityAsc(String companyId);
}
