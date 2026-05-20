package com.foxprocureflow.search;

import com.foxprocureflow.common.api.ApiEnvelope;
import com.foxprocureflow.search.GlobalSearchDtos.GlobalSearchResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/global-search")
public class GlobalSearchController {

    private final GlobalSearchService globalSearchService;

    public GlobalSearchController(GlobalSearchService globalSearchService) {
        this.globalSearchService = globalSearchService;
    }

    @Operation(summary = "Search procurement business objects and shared reference data")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Search completed; empty or short queries return an empty group list"),
        @ApiResponse(responseCode = "400", description = "companyId is missing"),
        @ApiResponse(responseCode = "404", description = "companyId is not part of the demo organization")
    })
    @GetMapping
    public ApiEnvelope<GlobalSearchResponse> search(
        @Parameter(description = "Current demo company context for company-owned transaction records")
        @RequestParam String companyId,
        @Parameter(description = "Search keyword, such as PR, RFQ, PO, invoice number, supplier, or user name")
        @RequestParam(defaultValue = "") String query
    ) {
        return ApiEnvelope.ok(globalSearchService.search(companyId, query));
    }
}
