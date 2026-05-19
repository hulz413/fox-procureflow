package com.foxprocureflow.procurement.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_order_delivery_schedules")
public class PurchaseOrderDeliveryScheduleJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String scheduleId;

    @Column(nullable = false, length = 64, unique = true)
    private String poId;

    @Column(nullable = false)
    private LocalDate plannedDeliveryDate;

    @Column(nullable = false)
    private String deliveryLocation;

    @Column(nullable = false, length = 80)
    private String contactPerson;

    @Column(nullable = false, length = 64)
    private String contactPhone;

    @Column(length = 500)
    private String deliveryNote;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected PurchaseOrderDeliveryScheduleJpaEntity() {
    }

    PurchaseOrderDeliveryScheduleJpaEntity(
        String scheduleId,
        String poId,
        LocalDate plannedDeliveryDate,
        String deliveryLocation,
        String contactPerson,
        String contactPhone,
        String deliveryNote
    ) {
        LocalDateTime now = LocalDateTime.now();
        this.scheduleId = scheduleId;
        this.poId = poId;
        this.plannedDeliveryDate = plannedDeliveryDate;
        this.deliveryLocation = deliveryLocation;
        this.contactPerson = contactPerson;
        this.contactPhone = contactPhone;
        this.deliveryNote = deliveryNote;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public String getScheduleId() {
        return scheduleId;
    }

    public String getPoId() {
        return poId;
    }

    public LocalDate getPlannedDeliveryDate() {
        return plannedDeliveryDate;
    }

    public String getDeliveryLocation() {
        return deliveryLocation;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public String getDeliveryNote() {
        return deliveryNote;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
