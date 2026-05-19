package com.foxprocureflow.common.demo;

import java.time.OffsetDateTime;
import java.util.concurrent.locks.ReentrantLock;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.output.MigrateResult;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DemoDataResetService {

    private final Flyway flyway;
    private final ReentrantLock resetLock = new ReentrantLock();

    public DemoDataResetService(Flyway flyway) {
        this.flyway = flyway;
    }

    public DemoDataResetResponse reset() {
        if (!resetLock.tryLock()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Demo data reset is already running");
        }

        try {
            OffsetDateTime startedAt = OffsetDateTime.now();
            Flyway resetFlyway = Flyway.configure()
                .configuration(flyway.getConfiguration())
                .cleanDisabled(false)
                .load();

            resetFlyway.clean();
            MigrateResult migrateResult = resetFlyway.migrate();

            return new DemoDataResetResponse(
                startedAt,
                OffsetDateTime.now(),
                migrateResult.migrationsExecuted,
                migrateResult.targetSchemaVersion);
        } catch (FlywayException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to reset demo data", exception);
        } finally {
            resetLock.unlock();
        }
    }
}
