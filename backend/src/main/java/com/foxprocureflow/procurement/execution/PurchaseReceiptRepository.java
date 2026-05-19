package com.foxprocureflow.procurement.execution;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseReceiptRepository extends JpaRepository<PurchaseReceiptJpaEntity, Long> {

    Optional<PurchaseReceiptJpaEntity> findByReceiptId(String receiptId);

    Optional<PurchaseReceiptJpaEntity> findFirstByReceiptIdStartingWithOrderByReceiptIdDesc(String receiptIdPrefix);

    List<PurchaseReceiptJpaEntity> findByCompanyIdOrderByCreatedAtDesc(String companyId);

    List<PurchaseReceiptJpaEntity> findByCompanyIdAndPoIdOrderByCreatedAtDesc(String companyId, String poId);

    List<PurchaseReceiptJpaEntity> findByPoIdOrderByCreatedAtAsc(String poId);

    List<PurchaseReceiptJpaEntity> findByPoIdIn(Collection<String> poIds);
}
