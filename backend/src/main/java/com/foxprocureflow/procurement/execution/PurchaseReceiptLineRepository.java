package com.foxprocureflow.procurement.execution;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseReceiptLineRepository extends JpaRepository<PurchaseReceiptLineJpaEntity, Long> {

    List<PurchaseReceiptLineJpaEntity> findByReceiptIdOrderByLineNoAsc(String receiptId);

    List<PurchaseReceiptLineJpaEntity> findByReceiptIdIn(Collection<String> receiptIds);

    List<PurchaseReceiptLineJpaEntity> findByPoIdOrderByLineNoAsc(String poId);

    List<PurchaseReceiptLineJpaEntity> findByPoIdIn(Collection<String> poIds);
}
