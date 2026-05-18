package com.foxprocureflow.procurement.request;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseRequestLineRepository extends JpaRepository<PurchaseRequestLineJpaEntity, Long> {

    List<PurchaseRequestLineJpaEntity> findByRequestIdOrderByLineNoAsc(String requestId);

    List<PurchaseRequestLineJpaEntity> findByRequestIdIn(Collection<String> requestIds);

    int countByRequestId(String requestId);
}
