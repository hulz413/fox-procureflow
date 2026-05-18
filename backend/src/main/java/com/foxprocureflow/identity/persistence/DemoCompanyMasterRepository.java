package com.foxprocureflow.identity.persistence;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoCompanyMasterRepository extends JpaRepository<DemoCompanyMasterJpaEntity, Long> {

    List<DemoCompanyMasterJpaEntity> findAllByOrderByIdAsc();

    Optional<DemoCompanyMasterJpaEntity> findByCompanyId(String companyId);

    Optional<DemoCompanyMasterJpaEntity> findFirstByActiveTrueOrderByIdAsc();
}
