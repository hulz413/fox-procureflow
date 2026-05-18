package com.foxprocureflow.identity.persistence;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoUserRoleRepository extends JpaRepository<DemoUserRoleJpaEntity, Long> {

    List<DemoUserRoleJpaEntity> findByUserIdIn(Collection<String> userIds);
}
