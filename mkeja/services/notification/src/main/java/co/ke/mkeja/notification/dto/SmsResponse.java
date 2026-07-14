package co.ke.mkeja.notification.dto;

import co.ke.mkeja.notification.model.enums.Status;
import lombok.Data;

@Data
public class SmsResponse {
    private Status status;

    private String statusCode;

    private String desc;

    private String to;

    private String msgId;

    private String cost;

    private String balance;

    private String mcc;

    private String mnc;
}
