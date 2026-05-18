package com.foxprocureflow.identity;

import com.foxprocureflow.identity.masterdata.MasterDataService;
import org.springframework.stereotype.Service;

@Service
public class DemoOrganizationService {

    private final MasterDataService masterDataService;

    public DemoOrganizationService(MasterDataService masterDataService) {
        this.masterDataService = masterDataService;
    }

    public DemoOrganizationContext getDemoContext() {
        return masterDataService.getDemoContext();
    }
}
