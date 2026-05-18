package com.foxprocureflow.identity.persistence;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoSupplierCategoryRepository extends JpaRepository<DemoSupplierCategoryJpaEntity, Long> {

    List<DemoSupplierCategoryJpaEntity> findBySupplierIdIn(Collection<String> supplierIds);

    List<DemoSupplierCategoryJpaEntity> findByCategoryId(String categoryId);
}
