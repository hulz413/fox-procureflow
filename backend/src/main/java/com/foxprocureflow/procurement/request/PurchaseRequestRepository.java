package com.foxprocureflow.procurement.request;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequestJpaEntity, Long> {

    Optional<PurchaseRequestJpaEntity> findByRequestId(String requestId);

    Optional<PurchaseRequestJpaEntity> findFirstByRequestIdStartingWithOrderByRequestIdDesc(String requestIdPrefix);

    List<PurchaseRequestJpaEntity> findByCompanyIdOrderByCreatedAtDesc(String companyId);

    List<PurchaseRequestJpaEntity> findByCompanyIdAndStatusOrderByCreatedAtDesc(
        String companyId,
        PurchaseRequestStatus status
    );
}
