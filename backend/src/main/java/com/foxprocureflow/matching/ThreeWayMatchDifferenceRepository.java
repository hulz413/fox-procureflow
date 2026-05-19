package com.foxprocureflow.matching;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThreeWayMatchDifferenceRepository extends JpaRepository<ThreeWayMatchDifferenceJpaEntity, Long> {

    List<ThreeWayMatchDifferenceJpaEntity> findByMatchIdOrderByCreatedAtAsc(String matchId);

    List<ThreeWayMatchDifferenceJpaEntity> findByMatchIdIn(Collection<String> matchIds);

    void deleteByMatchId(String matchId);
}
