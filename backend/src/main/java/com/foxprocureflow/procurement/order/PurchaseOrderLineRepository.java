package com.foxprocureflow.procurement.order;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseOrderLineRepository extends JpaRepository<PurchaseOrderLineJpaEntity, Long> {

    List<PurchaseOrderLineJpaEntity> findByPoIdOrderByLineNoAsc(String poId);

    List<PurchaseOrderLineJpaEntity> findByPoIdIn(Collection<String> poIds);
}
