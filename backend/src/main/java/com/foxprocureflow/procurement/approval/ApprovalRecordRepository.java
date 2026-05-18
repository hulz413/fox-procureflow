package com.foxprocureflow.procurement.approval;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalRecordRepository extends JpaRepository<ApprovalRecordJpaEntity, Long> {

    List<ApprovalRecordJpaEntity> findByApprovalIdOrderByCreatedAtAsc(String approvalId);

    int countByApprovalId(String approvalId);
}
