package com.foxprocureflow.identity.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoUserRepository extends JpaRepository<DemoUserJpaEntity, Long> {

    List<DemoUserJpaEntity> findByCompanyIdOrderByDisplayNameAsc(String companyId);
}
