package com.foxprocureflow.identity.persistence;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoSupplierRepository extends JpaRepository<DemoSupplierJpaEntity, Long> {

    List<DemoSupplierJpaEntity> findAllByOrderBySupplierNameAsc();

    Optional<DemoSupplierJpaEntity> findBySupplierId(String supplierId);
}
