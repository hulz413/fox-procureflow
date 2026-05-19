package com.foxprocureflow.procurement.execution;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierInvoiceRepository extends JpaRepository<SupplierInvoiceJpaEntity, Long> {

    Optional<SupplierInvoiceJpaEntity> findByInvoiceId(String invoiceId);

    Optional<SupplierInvoiceJpaEntity> findFirstByInvoiceIdStartingWithOrderByInvoiceIdDesc(String invoiceIdPrefix);

    List<SupplierInvoiceJpaEntity> findByCompanyIdOrderByCreatedAtDesc(String companyId);

    List<SupplierInvoiceJpaEntity> findByCompanyIdAndPoIdOrderByCreatedAtDesc(String companyId, String poId);

    List<SupplierInvoiceJpaEntity> findByPoIdOrderByCreatedAtAsc(String poId);

    List<SupplierInvoiceJpaEntity> findByPoIdIn(Collection<String> poIds);

    boolean existsByCompanyIdAndSupplierIdAndInvoiceNumber(String companyId, String supplierId, String invoiceNumber);
}
