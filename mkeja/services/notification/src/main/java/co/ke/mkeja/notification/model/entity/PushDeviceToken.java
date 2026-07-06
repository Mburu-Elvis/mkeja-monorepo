package co.ke.mkeja.notification.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tbl_push_device_token", indexes = {
        @Index(name = "idx_push_token_user", columnList = "user_id"),
        @Index(name = "idx_push_token_value", columnList = "token", unique = true)
})
public class PushDeviceToken extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "token", nullable = false, length = 512)
    private String token;

    @Column(name = "platform", nullable = false, length = 20)
    private String platform;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
