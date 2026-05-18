package com.foxprocureflow.procurement.approval;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalNodeRepository extends JpaRepository<ApprovalNodeJpaEntity, Long> {

    List<ApprovalNodeJpaEntity> findByApprovalIdOrderByStepOrderAsc(String approvalId);

    List<ApprovalNodeJpaEntity> findByApprovalIdIn(Collection<String> approvalIds);

    Optional<ApprovalNodeJpaEntity> findByApprovalIdAndStatus(String approvalId, ApprovalNodeStatus status);

    List<ApprovalNodeJpaEntity> findByApprovalIdAndStatusOrderByStepOrderAsc(
        String approvalId,
        ApprovalNodeStatus status
    );

    List<ApprovalNodeJpaEntity> findByCompanyIdAndApproverIdAndStatusOrderByActivatedAtAsc(
        String companyId,
        String approverId,
        ApprovalNodeStatus status
    );
}
