package com.foxprocureflow.common.health;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.foxprocureflow.config.SecurityConfig;
import com.foxprocureflow.identity.DemoCompanyContext;
import com.foxprocureflow.identity.DemoOrganizationContext;
import com.foxprocureflow.identity.DemoOrganizationService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.when;

@WebMvcTest(HealthController.class)
@Import(SecurityConfig.class)
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DemoOrganizationService demoOrganizationService;

    @Test
    void returnsDemoContext() throws Exception {
        when(demoOrganizationService.getDemoContext()).thenReturn(demoContext());

        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.status").value("UP"))
            .andExpect(jsonPath("$.data.application").value("Fox Procureflow"))
            .andExpect(jsonPath("$.data.demoContext.groupName").value("星河控股集团"))
            .andExpect(jsonPath("$.data.demoContext.activeCompany.companyName").value("星河数字科技有限公司"));
    }

    private static DemoOrganizationContext demoContext() {
        DemoCompanyContext digital = new DemoCompanyContext(
            "company-digital",
            "星河数字科技有限公司",
            "IT 设备、软件订阅、办公采购",
            true);
        DemoCompanyContext manufacturing = new DemoCompanyContext(
            "company-manufacturing",
            "星河智能制造有限公司",
            "生产耗材、设备备件、物流服务",
            false);

        return new DemoOrganizationContext(
            "group-xinghe",
            "星河控股集团",
            digital,
            List.of(digital, manufacturing),
            "集团共享供应商池",
            new DemoOrganizationContext.DataBoundary(
                "供应商池、采购品类模板、集团级看板汇总",
                "部门、用户、预算科目，以及后续采购单据"));
    }
}
