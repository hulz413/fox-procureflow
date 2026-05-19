package com.foxprocureflow.procurement.order;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrderJpaEntity, Long> {

    Optional<PurchaseOrderJpaEntity> findByPoId(String poId);

    Optional<PurchaseOrderJpaEntity> findFirstByPoIdStartingWithOrderByPoIdDesc(String poIdPrefix);

    List<PurchaseOrderJpaEntity> findByCompanyIdOrderByCreatedAtDesc(String companyId);

    List<PurchaseOrderJpaEntity> findByCompanyIdAndStatusOrderByCreatedAtDesc(
        String companyId,
        PurchaseOrderStatus status
    );

    boolean existsByRfqId(String rfqId);
}
