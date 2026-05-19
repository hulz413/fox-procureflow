package com.foxprocureflow.procurement.execution;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierInvoiceLineRepository extends JpaRepository<SupplierInvoiceLineJpaEntity, Long> {

    List<SupplierInvoiceLineJpaEntity> findByInvoiceIdOrderByLineNoAsc(String invoiceId);

    List<SupplierInvoiceLineJpaEntity> findByInvoiceIdIn(Collection<String> invoiceIds);

    List<SupplierInvoiceLineJpaEntity> findByPoIdOrderByLineNoAsc(String poId);

    List<SupplierInvoiceLineJpaEntity> findByPoIdIn(Collection<String> poIds);
}
