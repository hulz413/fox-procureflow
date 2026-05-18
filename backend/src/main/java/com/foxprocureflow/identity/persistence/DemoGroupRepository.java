package com.foxprocureflow.identity.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoGroupRepository extends JpaRepository<DemoGroupJpaEntity, Long> {

    Optional<DemoGroupJpaEntity> findByGroupId(String groupId);

    Optional<DemoGroupJpaEntity> findFirstByOrderByIdAsc();
}
