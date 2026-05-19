package com.foxprocureflow.procurement.order;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseOrderDeliveryScheduleRepository extends JpaRepository<PurchaseOrderDeliveryScheduleJpaEntity, Long> {

    Optional<PurchaseOrderDeliveryScheduleJpaEntity> findByPoId(String poId);

    List<PurchaseOrderDeliveryScheduleJpaEntity> findByPoIdIn(Collection<String> poIds);
}
