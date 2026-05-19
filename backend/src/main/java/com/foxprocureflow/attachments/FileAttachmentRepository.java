package com.foxprocureflow.attachments;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileAttachmentRepository extends JpaRepository<FileAttachmentJpaEntity, Long> {

    Optional<FileAttachmentJpaEntity> findByAttachmentId(String attachmentId);

    List<FileAttachmentJpaEntity> findByAttachmentIdIn(Collection<String> attachmentIds);

    List<FileAttachmentJpaEntity> findByCompanyIdAndTargetTypeAndTargetIdOrderByCreatedAtDesc(
        String companyId,
        FileAttachmentTargetType targetType,
        String targetId
    );
}
