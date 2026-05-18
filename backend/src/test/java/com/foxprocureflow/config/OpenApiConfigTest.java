package com.foxprocureflow.config;

import static org.assertj.core.api.Assertions.assertThat;

import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class OpenApiConfigTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
        .withUserConfiguration(OpenApiConfig.class);

    @Test
    void loadsOpenApiBean() {
        contextRunner.run(context -> {
            assertThat(context).hasSingleBean(OpenAPI.class);
            assertThat(context.getBean(OpenAPI.class).getInfo().getTitle())
                .isEqualTo("Fox Procureflow API");
        });
    }
}
