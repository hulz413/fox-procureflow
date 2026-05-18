package com.foxprocureflow.identity.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoCompanyRepository extends JpaRepository<DemoCompanyJpaEntity, Long> {

    Optional<DemoCompanyJpaEntity> findByCompanyId(String companyId);
}
