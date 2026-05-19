package com.foxprocureflow.matching;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThreeWayMatchResultRepository extends JpaRepository<ThreeWayMatchResultJpaEntity, Long> {

    Optional<ThreeWayMatchResultJpaEntity> findByMatchId(String matchId);

    Optional<ThreeWayMatchResultJpaEntity> findByPoId(String poId);

    Optional<ThreeWayMatchResultJpaEntity> findFirstByMatchIdStartingWithOrderByMatchIdDesc(String matchIdPrefix);

    List<ThreeWayMatchResultJpaEntity> findByCompanyIdOrderByUpdatedAtDesc(String companyId);

    List<ThreeWayMatchResultJpaEntity> findByCompanyIdAndStatusOrderByUpdatedAtDesc(
        String companyId,
        ThreeWayMatchStatus status
    );
}
