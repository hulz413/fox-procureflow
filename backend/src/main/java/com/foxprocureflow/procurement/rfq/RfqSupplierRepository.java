package com.foxprocureflow.procurement.rfq;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RfqSupplierRepository extends JpaRepository<RfqSupplierJpaEntity, Long> {

    List<RfqSupplierJpaEntity> findByRfqIdOrderBySupplierNameAsc(String rfqId);

    List<RfqSupplierJpaEntity> findByRfqIdIn(Collection<String> rfqIds);

    Optional<RfqSupplierJpaEntity> findByRfqIdAndSupplierId(String rfqId, String supplierId);

    boolean existsByRfqIdAndSupplierId(String rfqId, String supplierId);
}
