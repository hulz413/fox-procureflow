package com.foxprocureflow.ai;

public interface AiProvider {

    boolean isConfigured();

    String model();

    String unavailableReason();

    AiProviderResult generate(AiProviderRequest request);
}
