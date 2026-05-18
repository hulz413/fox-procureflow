package com.foxprocureflow.procurement.approval;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalInstanceRepository extends JpaRepository<ApprovalInstanceJpaEntity, Long> {

    Optional<ApprovalInstanceJpaEntity> findByApprovalId(String approvalId);

    Optional<ApprovalInstanceJpaEntity> findByRequestId(String requestId);

    List<ApprovalInstanceJpaEntity> findByRequestIdIn(Collection<String> requestIds);

    List<ApprovalInstanceJpaEntity> findByApprovalIdIn(Collection<String> approvalIds);

    Optional<ApprovalInstanceJpaEntity> findFirstByApprovalIdStartingWithOrderByApprovalIdDesc(String approvalIdPrefix);

    boolean existsByRequestId(String requestId);
}
