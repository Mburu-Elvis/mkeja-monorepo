package co.ke.mkeja.onboarding.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_onboarding_sessions")
public class OnboardingSession extends BaseEntity {
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "invitation_code", length = 36)
    private String invitationCode;

    @Column(name = "current_step", nullable = false)
    private int currentStep = 1;

    @Column(name = "completed_steps", columnDefinition = "TEXT")
    private String completedSteps;

    @Column(name = "session_type", nullable = false)
    private String sessionType;
}
