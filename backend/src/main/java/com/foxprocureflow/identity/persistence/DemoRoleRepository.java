package com.foxprocureflow.identity.persistence;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoRoleRepository extends JpaRepository<DemoRoleJpaEntity, Long> {

    List<DemoRoleJpaEntity> findByRoleIdIn(Collection<String> roleIds);
}
