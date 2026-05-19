package com.foxprocureflow.procurement.order;

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
@Table(name = "purchase_order_status_records")
public class PurchaseOrderStatusRecordJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 96, unique = true)
    private String recordId;

    @Column(nullable = false, length = 64)
    private String poId;

    @Column(nullable = false, length = 64)
    private String companyId;

    @Column(nullable = false, length = 64)
    private String actorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PurchaseOrderAction action;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private PurchaseOrderStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PurchaseOrderStatus toStatus;

    @Column(name = "comment_text", length = 1000)
    private String comment;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected PurchaseOrderStatusRecordJpaEntity() {
    }

    PurchaseOrderStatusRecordJpaEntity(
        String recordId,
        String poId,
        String companyId,
        String actorId,
        PurchaseOrderAction action,
        PurchaseOrderStatus fromStatus,
        PurchaseOrderStatus toStatus,
        String comment
    ) {
        this.recordId = recordId;
        this.poId = poId;
        this.companyId = companyId;
        this.actorId = actorId;
        this.action = action;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.comment = comment;
        this.createdAt = LocalDateTime.now();
    }

    public String getRecordId() {
        return recordId;
    }

    public String getPoId() {
        return poId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getActorId() {
        return actorId;
    }

    public PurchaseOrderAction getAction() {
        return action;
    }

    public PurchaseOrderStatus getFromStatus() {
        return fromStatus;
    }

    public PurchaseOrderStatus getToStatus() {
        return toStatus;
    }

    public String getComment() {
        return comment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
