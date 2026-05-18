package com.foxprocureflow.identity;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DemoOrganizationService {

    public DemoOrganizationContext getDemoContext() {
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
                "采购申请、审批实例、RFQ、PO、收货、发票、三单匹配结果"));
    }
}
