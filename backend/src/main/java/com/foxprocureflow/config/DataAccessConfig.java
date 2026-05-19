package com.foxprocureflow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableJpaRepositories(basePackages = {
    "com.foxprocureflow.identity.persistence",
    "com.foxprocureflow.matching",
    "com.foxprocureflow.procurement.approval",
    "com.foxprocureflow.procurement.execution",
    "com.foxprocureflow.procurement.order",
    "com.foxprocureflow.procurement.rfq",
    "com.foxprocureflow.procurement.request"
})
@EnableMongoRepositories(basePackages = "com.foxprocureflow.identity.document")
public class DataAccessConfig {
}
