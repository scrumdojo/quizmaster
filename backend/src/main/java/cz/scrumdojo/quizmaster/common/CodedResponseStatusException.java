package cz.scrumdojo.quizmaster.common;

import org.springframework.http.HttpStatusCode;
import org.springframework.web.server.ResponseStatusException;

/**
 * A {@link ResponseStatusException} that also carries a stable, English-free
 * error code so the frontend can translate the message instead of relying on
 * the (English-only) reason text. GlobalExceptionHandler includes the code in
 * the response body when present.
 */
public class CodedResponseStatusException extends ResponseStatusException {

    private final String code;

    public CodedResponseStatusException(HttpStatusCode status, String reason, String code) {
        super(status, reason);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
