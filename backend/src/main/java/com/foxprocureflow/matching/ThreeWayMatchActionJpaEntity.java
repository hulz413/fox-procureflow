package com.foxprocureflow.matching;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "three_way_match_actions")
public class ThreeWayMatchActionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 96, unique = true)
    private String actionId;

    @Column(nullable = false, length = 80)
    private String matchId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ThreeWayMatchActionType actionType;

    @Column(nullable = false, length = 64)
    private String actorId;

    @Column(nullable = false, length = 1000)
    private String note;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected ThreeWayMatchActionJpaEntity() {
    }

    ThreeWayMatchActionJpaEntity(
        String actionId,
        String matchId,
        String companyId,
        ThreeWayMatchActionType actionType,
        String actorId,
        String note
    ) {
        this.actionId = actionId;
        this.matchId = matchId;
        this.companyId = companyId;
        this.actionType = actionType;
        this.actorId = actorId;
        this.note = note;
        this.createdAt = LocalDateTime.now();
    }

    public String getActionId() {
        return actionId;
    }

    public String getMatchId() {
        return matchId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public ThreeWayMatchActionType getActionType() {
        return actionType;
    }

    public String getActorId() {
        return actorId;
    }

    public String getNote() {
        return note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
