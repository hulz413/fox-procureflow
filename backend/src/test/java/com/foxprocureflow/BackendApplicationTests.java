package com.foxprocureflow;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BackendApplicationTests {

    @Test
    void exposesApplicationEntryPoint() {
        assertThat(BackendApplication.class).isNotNull();
    }
}
