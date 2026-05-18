package com.foxprocureflow.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI foxProcureflowOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("Fox Procureflow API")
                .version("0.0.1")
                .description("集团内部多公司采购协同平台 API"));
    }
}
