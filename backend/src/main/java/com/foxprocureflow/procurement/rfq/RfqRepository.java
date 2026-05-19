package com.foxprocureflow.procurement.rfq;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RfqRepository extends JpaRepository<RfqJpaEntity, Long> {

    Optional<RfqJpaEntity> findByRfqId(String rfqId);

    Optional<RfqJpaEntity> findByRequestId(String requestId);

    Optional<RfqJpaEntity> findFirstByRfqIdStartingWithOrderByRfqIdDesc(String rfqIdPrefix);

    List<RfqJpaEntity> findByCompanyIdOrderByCreatedAtDesc(String companyId);

    List<RfqJpaEntity> findByCompanyIdAndStatusOrderByCreatedAtDesc(String companyId, RfqStatus status);

    boolean existsByRequestId(String requestId);
}
