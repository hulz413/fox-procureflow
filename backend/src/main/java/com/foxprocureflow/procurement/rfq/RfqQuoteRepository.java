package com.foxprocureflow.procurement.rfq;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RfqQuoteRepository extends JpaRepository<RfqQuoteJpaEntity, Long> {

    List<RfqQuoteJpaEntity> findByRfqIdOrderByCreatedAtAsc(String rfqId);

    List<RfqQuoteJpaEntity> findByRfqIdIn(Collection<String> rfqIds);

    Optional<RfqQuoteJpaEntity> findByRfqIdAndSupplierId(String rfqId, String supplierId);
}
