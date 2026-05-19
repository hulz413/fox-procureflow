package com.foxprocureflow.matching;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThreeWayMatchActionRepository extends JpaRepository<ThreeWayMatchActionJpaEntity, Long> {

    Optional<ThreeWayMatchActionJpaEntity> findFirstByActionIdStartingWithOrderByActionIdDesc(String actionIdPrefix);

    List<ThreeWayMatchActionJpaEntity> findByMatchIdOrderByCreatedAtAsc(String matchId);

    List<ThreeWayMatchActionJpaEntity> findByMatchIdIn(Collection<String> matchIds);
}
