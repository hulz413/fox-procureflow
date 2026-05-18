package com.foxprocureflow.procurement.approval;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalRuleStepRepository extends JpaRepository<ApprovalRuleStepJpaEntity, Long> {

    List<ApprovalRuleStepJpaEntity> findByRuleIdOrderByStepOrderAsc(String ruleId);
}
