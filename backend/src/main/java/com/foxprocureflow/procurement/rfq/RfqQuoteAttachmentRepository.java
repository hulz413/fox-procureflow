package com.foxprocureflow.procurement.rfq;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RfqQuoteAttachmentRepository extends JpaRepository<RfqQuoteAttachmentJpaEntity, Long> {

    List<RfqQuoteAttachmentJpaEntity> findByQuoteId(String quoteId);

    List<RfqQuoteAttachmentJpaEntity> findByQuoteIdIn(Collection<String> quoteIds);

    List<RfqQuoteAttachmentJpaEntity> findByFileAttachmentIdIn(Collection<String> fileAttachmentIds);
}
