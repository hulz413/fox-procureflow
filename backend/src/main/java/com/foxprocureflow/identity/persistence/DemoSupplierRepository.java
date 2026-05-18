package com.foxprocureflow.identity.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoSupplierRepository extends JpaRepository<DemoSupplierJpaEntity, Long> {

    List<DemoSupplierJpaEntity> findAllByOrderBySupplierNameAsc();
}
