package co.ke.mkeja.discovery.util;

import co.ke.mkeja.discovery.exception.BadRequestException;

public final class PhoneUtil {

    private PhoneUtil() {}

    public static String normalizeKenyanPhone(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException("Phone number is required");
        }

        String digits = raw.replaceAll("\\D", "");
        if (digits.startsWith("254")) {
            digits = digits.substring(3);
        } else if (digits.startsWith("0")) {
            digits = digits.substring(1);
        }

        if (digits.length() != 9) {
            throw new BadRequestException("Enter a valid Kenyan phone number");
        }

        if (!digits.startsWith("7") && !digits.startsWith("1")) {
            throw new BadRequestException("Enter a valid M-PESA number (2547XXXXXXXX or 2541XXXXXXXX)");
        }

        return "254" + digits;
    }
}
