package com.foxprocureflow.identity.persistence;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoProcurementCategoryRepository extends JpaRepository<DemoProcurementCategoryJpaEntity, Long> {

    List<DemoProcurementCategoryJpaEntity> findAllByOrderBySortOrderAsc();

    Optional<DemoProcurementCategoryJpaEntity> findByCategoryId(String categoryId);
}
