package com.foxprocureflow.procurement.execution;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierInvoiceAttachmentRepository extends JpaRepository<SupplierInvoiceAttachmentJpaEntity, Long> {

    List<SupplierInvoiceAttachmentJpaEntity> findByInvoiceIdOrderByCreatedAtAsc(String invoiceId);

    List<SupplierInvoiceAttachmentJpaEntity> findByInvoiceIdIn(Collection<String> invoiceIds);
}
