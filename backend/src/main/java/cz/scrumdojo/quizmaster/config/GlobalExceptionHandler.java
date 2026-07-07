package cz.scrumdojo.quizmaster.config;

import cz.scrumdojo.quizmaster.common.CodedResponseStatusException;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public Map<String, Object> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("status", 400);
        error.put("error", "Bad Request");
        error.put("message", ex.getBindingResult().getAllErrors().get(0).getDefaultMessage());
        return error;
    }

    @ExceptionHandler(ResponseStatusException.class)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("status", ex.getStatusCode().value());
        error.put("error", ex.getStatusCode().toString());
        error.put("message", ex.getReason() != null ? ex.getReason() : ex.getMessage());
        if (ex instanceof CodedResponseStatusException coded) {
            error.put("code", coded.getCode());
        }
        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }

    @ExceptionHandler(Exception.class)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("status", 500);
        error.put("error", "Internal Server Error");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
