package com.foxprocureflow.procurement.order;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseOrderStatusRecordRepository extends JpaRepository<PurchaseOrderStatusRecordJpaEntity, Long> {

    List<PurchaseOrderStatusRecordJpaEntity> findByPoIdOrderByCreatedAtAsc(String poId);

    List<PurchaseOrderStatusRecordJpaEntity> findByPoIdIn(Collection<String> poIds);
}
