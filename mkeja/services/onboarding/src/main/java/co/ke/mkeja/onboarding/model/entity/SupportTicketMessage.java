package co.ke.mkeja.onboarding.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Data
@EqualsAndHashCode(callSuper = true, exclude = {"ticket"})
@ToString(exclude = {"ticket"})
@Entity
@Table(name = "tbl_support_ticket_messages")
public class SupportTicketMessage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private SupportTicket ticket;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "from_user", nullable = false)
    private boolean fromUser = true;

    @Column(name = "author_name", length = 120)
    private String authorName;
}
