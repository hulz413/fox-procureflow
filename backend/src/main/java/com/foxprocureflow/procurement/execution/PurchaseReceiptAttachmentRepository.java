package com.foxprocureflow.procurement.execution;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseReceiptAttachmentRepository extends JpaRepository<PurchaseReceiptAttachmentJpaEntity, Long> {

    List<PurchaseReceiptAttachmentJpaEntity> findByReceiptIdOrderByCreatedAtAsc(String receiptId);

    List<PurchaseReceiptAttachmentJpaEntity> findByReceiptIdIn(Collection<String> receiptIds);
}
